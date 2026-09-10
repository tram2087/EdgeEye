from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database import get_db
from backend.app import models, schemas

router = APIRouter(prefix="/api/events", tags=["Events"])

@router.get("", response_model=List[schemas.EventResponse])
def get_events(
    camera_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(models.Event)
    if camera_id:
        query = query.filter(models.Event.camera_id == camera_id)
    if event_type:
        query = query.filter(models.Event.event_type == event_type)
    if severity:
        query = query.filter(models.Event.severity == severity)
    if status:
        query = query.filter(models.Event.status == status)

    events = query.order_by(models.Event.timestamp.desc()).offset(offset).limit(limit).all()
    return events

@router.get("/{event_id}", response_model=schemas.EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post("", response_model=schemas.EventResponse)
def create_event(event_in: schemas.EventCreate, db: Session = Depends(get_db)):
    event = models.Event(**event_in.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
