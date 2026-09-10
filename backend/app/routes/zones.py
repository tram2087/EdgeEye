from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database import get_db
from backend.app import models, schemas

router = APIRouter(prefix="/api/zones", tags=["Zones"])

@router.get("", response_model=List[schemas.ZoneResponse])
def get_zones(
    camera_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Zone)
    if camera_id:
        query = query.filter(models.Zone.camera_id == camera_id)
    return query.all()

@router.post("", response_model=schemas.ZoneResponse)
def create_zone(zone_in: schemas.ZoneCreate, db: Session = Depends(get_db)):
    cam = db.query(models.Camera).filter(models.Camera.id == zone_in.camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Associated camera does not exist")

    zone = models.Zone(
        camera_id=zone_in.camera_id,
        name=zone_in.name,
        zone_type=zone_in.zone_type,
        coordinates=zone_in.coordinates,
        severity=zone_in.severity,
        enabled=zone_in.enabled
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone

@router.get("/{zone_id}", response_model=schemas.ZoneResponse)
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone

@router.put("/{zone_id}", response_model=schemas.ZoneResponse)
def update_zone(zone_id: int, zone_update: schemas.ZoneUpdate, db: Session = Depends(get_db)):
    zone = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    if zone_update.name is not None:
        zone.name = zone_update.name
    if zone_update.zone_type is not None:
        zone.zone_type = zone_update.zone_type
    if zone_update.coordinates is not None:
        zone.coordinates = zone_update.coordinates
    if zone_update.severity is not None:
        zone.severity = zone_update.severity
    if zone_update.enabled is not None:
        zone.enabled = zone_update.enabled

    db.commit()
    db.refresh(zone)
    return zone

@router.delete("/{zone_id}")
def delete_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    db.delete(zone)
    db.commit()
    return {"success": True, "message": f"Zone {zone_id} deleted"}
