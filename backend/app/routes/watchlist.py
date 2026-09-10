from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app import models, schemas

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])

@router.get("", response_model=List[schemas.WatchlistResponse])
def get_watchlist(db: Session = Depends(get_db)):
    return db.query(models.Watchlist).all()

@router.post("", response_model=schemas.WatchlistResponse)
def add_to_watchlist(item_in: schemas.WatchlistCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Watchlist).filter(models.Watchlist.plate_number == item_in.plate_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plate already on watchlist")

    item = models.Watchlist(
        plate_number=item_in.plate_number,
        reason=item_in.reason,
        severity=item_in.severity,
        description=item_in.description,
        active=item_in.active
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_from_watchlist(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Watchlist).filter(models.Watchlist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist entry not found")
    db.delete(item)
    db.commit()
    return {"success": True, "message": f"Plate {item.plate_number} removed from watchlist"}
