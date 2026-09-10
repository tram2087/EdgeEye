from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import os
import cv2
import numpy as np

from backend.app.database import get_db
from backend.app import models, schemas
from ai.anpr import ANPREngine

router = APIRouter(prefix="/api/anpr", tags=["ANPR"])
anpr_engine = ANPREngine()

@router.get("", response_model=List[schemas.PlateResponse])
def get_plates(
    status: Optional[str] = Query(None),
    camera_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(models.Plate)
    if status:
        query = query.filter(models.Plate.status == status)
    if camera_id:
        query = query.filter(models.Plate.camera_id == camera_id)
    return query.order_by(models.Plate.timestamp.desc()).limit(limit).all()

@router.post("/process", response_model=schemas.PlateResponse)
async def process_plate_upload(
    camera_id: str = Form("CHECKPOST-01"),
    vehicle_type: str = Form("Car"),
    plate_text_manual: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    plate_number = plate_text_manual
    confidence = 0.95
    snapshot_filename = None

    if file:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is not None:
            # Save snapshot
            evidence_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "evidence"))
            os.makedirs(evidence_dir, exist_ok=True)
            timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:19]
            snapshot_filename = f"anpr_{camera_id}_{timestamp_str}.jpg"
            cv2.imwrite(os.path.join(evidence_dir, snapshot_filename), img)

            extracted_text, conf = anpr_engine.extract_plate_text(img)
            if not plate_number:
                plate_number = extracted_text
                confidence = conf

    if not plate_number:
        plate_number = "DEMO-4821"

    # Check watchlist
    clean_plate = plate_number.replace(" ", "").replace("-", "").upper()
    watchlist_matches = db.query(models.Watchlist).filter(models.Watchlist.active == True).all()
    status = "AUTHORIZED"
    for w in watchlist_matches:
        if w.plate_number.replace(" ", "").replace("-", "").upper() == clean_plate:
            status = "WATCHLIST"
            break
    if "DEMO" in clean_plate:
        status = "WATCHLIST"

    plate = models.Plate(
        plate_number=plate_number,
        vehicle_type=vehicle_type,
        camera_id=camera_id,
        confidence=confidence,
        status=status,
        snapshot_path=snapshot_filename
    )
    db.add(plate)

    # If watchlist, create alert & event
    if status == "WATCHLIST":
        ev = models.Event(
            camera_id=camera_id,
            event_type="WATCHLIST_MATCH",
            object_id=f"Plate {plate_number}",
            confidence=confidence,
            severity="CRITICAL",
            status="NEW",
            snapshot_path=snapshot_filename,
            metadata_json=f'{{"plate": "{plate_number}", "vehicle_type": "{vehicle_type}"}}'
        )
        db.add(ev)
        db.flush()

        alert = models.Alert(
            event_id=ev.id,
            camera_id=camera_id,
            title=f"Watchlist Target Vehicle Detected — {camera_id}",
            message=f"Vehicle with plate {plate_number} identified on security watchlist.",
            severity="CRITICAL",
            status="UNACKNOWLEDGED"
        )
        db.add(alert)

    db.commit()
    db.refresh(plate)
    return plate
