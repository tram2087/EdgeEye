from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from backend.app.database import get_db
from backend.app import models, schemas

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[schemas.AlertResponse])
def get_alerts(
    camera_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(models.Alert)
    if camera_id:
        query = query.filter(models.Alert.camera_id == camera_id)
    if severity:
        query = query.filter(models.Alert.severity == severity)
    if status:
        query = query.filter(models.Alert.status == status)

    alerts = query.order_by(models.Alert.created_at.desc()).limit(limit).all()
    
    results = []
    for a in alerts:
        snapshot = None
        if a.event and a.event.snapshot_path:
            snapshot = a.event.snapshot_path
        
        results.append({
            "id": a.id,
            "camera_id": a.camera_id,
            "event_id": a.event_id,
            "title": a.title,
            "message": a.message,
            "severity": a.severity,
            "status": a.status,
            "acknowledged_by": a.acknowledged_by,
            "acknowledged_at": a.acknowledged_at,
            "created_at": a.created_at,
            "snapshot_path": snapshot
        })
    return results

@router.patch("/{alert_id}", response_model=schemas.AlertResponse)
def update_alert(
    alert_id: int,
    alert_update: schemas.AlertUpdate,
    db: Session = Depends(get_db)
):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if alert_update.status:
        alert.status = alert_update.status
        if alert_update.status in ["ACKNOWLEDGED", "RESOLVED"]:
            alert.acknowledged_at = datetime.datetime.utcnow()
            alert.acknowledged_by = alert_update.acknowledged_by or "operator"

    db.commit()
    db.refresh(alert)
    return alert

@router.post("/acknowledge-all")
def acknowledge_all(db: Session = Depends(get_db)):
    db.query(models.Alert).filter(models.Alert.status == "UNACKNOWLEDGED").update({
        models.Alert.status: "ACKNOWLEDGED",
        models.Alert.acknowledged_by: "operator",
        models.Alert.acknowledged_at: datetime.datetime.utcnow()
    })
    db.commit()
    return {"success": True, "message": "All pending alerts marked as acknowledged"}

@router.get("/stats")
def get_alert_stats(db: Session = Depends(get_db)):
    total = db.query(models.Alert).count()
    unack = db.query(models.Alert).filter(models.Alert.status == "UNACKNOWLEDGED").count()
    critical = db.query(models.Alert).filter(
        models.Alert.severity == "CRITICAL",
        models.Alert.status == "UNACKNOWLEDGED"
    ).count()
    high = db.query(models.Alert).filter(
        models.Alert.severity == "HIGH",
        models.Alert.status == "UNACKNOWLEDGED"
    ).count()

    return {
        "total_alerts": total,
        "active_alerts": unack,
        "critical_alerts": critical,
        "high_alerts": high
    }
