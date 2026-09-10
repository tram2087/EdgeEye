from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import cv2
import os

from backend.app.database import get_db
from backend.app import models, schemas

router = APIRouter(prefix="/api/cameras", tags=["Cameras"])

@router.get("", response_model=List[schemas.CameraResponse])
def get_cameras(db: Session = Depends(get_db)):
    cameras = db.query(models.Camera).all()
    results = []
    for cam in cameras:
        # Compute people/vehicle count from latest detections or mock
        active_alerts = db.query(models.Alert).filter(
            models.Alert.camera_id == cam.id,
            models.Alert.status == "UNACKNOWLEDGED"
        ).count()

        results.append({
            "id": cam.id,
            "name": cam.name,
            "location": cam.location,
            "source_type": cam.source_type,
            "source_url": cam.source_url,
            "status": cam.status,
            "fps": cam.fps,
            "resolution": cam.resolution,
            "is_active": cam.is_active,
            "created_at": cam.created_at,
            "people_count": 2 if cam.status == "ONLINE" else 0,
            "vehicle_count": 1 if cam.status == "ONLINE" else 0,
            "active_alerts_count": active_alerts
        })
    return results

@router.post("", response_model=schemas.CameraResponse)
def create_camera(cam_in: schemas.CameraCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Camera).filter(models.Camera.id == cam_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Camera ID already exists")

    cam = models.Camera(
        id=cam_in.id,
        name=cam_in.name,
        location=cam_in.location,
        source_type=cam_in.source_type,
        source_url=cam_in.source_url,
        status=cam_in.status,
        fps=cam_in.fps,
        resolution=cam_in.resolution,
        is_active=cam_in.is_active
    )
    db.add(cam)
    db.commit()
    db.refresh(cam)
    return {
        "id": cam.id,
        "name": cam.name,
        "location": cam.location,
        "source_type": cam.source_type,
        "source_url": cam.source_url,
        "status": cam.status,
        "fps": cam.fps,
        "resolution": cam.resolution,
        "is_active": cam.is_active,
        "created_at": cam.created_at,
        "people_count": 0,
        "vehicle_count": 0,
        "active_alerts_count": 0
    }

@router.get("/{cam_id}", response_model=schemas.CameraResponse)
def get_camera(cam_id: str, db: Session = Depends(get_db)):
    cam = db.query(models.Camera).filter(models.Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    active_alerts = db.query(models.Alert).filter(
        models.Alert.camera_id == cam.id,
        models.Alert.status == "UNACKNOWLEDGED"
    ).count()

    return {
        "id": cam.id,
        "name": cam.name,
        "location": cam.location,
        "source_type": cam.source_type,
        "source_url": cam.source_url,
        "status": cam.status,
        "fps": cam.fps,
        "resolution": cam.resolution,
        "is_active": cam.is_active,
        "created_at": cam.created_at,
        "people_count": 2,
        "vehicle_count": 1,
        "active_alerts_count": active_alerts
    }

@router.put("/{cam_id}", response_model=schemas.CameraResponse)
def update_camera(cam_id: str, cam_in: schemas.CameraUpdate, db: Session = Depends(get_db)):
    cam = db.query(models.Camera).filter(models.Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")

    if cam_in.name is not None:
        cam.name = cam_in.name
    if cam_in.location is not None:
        cam.location = cam_in.location
    if cam_in.source_type is not None:
        cam.source_type = cam_in.source_type
    if cam_in.source_url is not None:
        cam.source_url = cam_in.source_url
    if cam_in.status is not None:
        cam.status = cam_in.status
    if cam_in.fps is not None:
        cam.fps = cam_in.fps
    if cam_in.resolution is not None:
        cam.resolution = cam_in.resolution
    if cam_in.is_active is not None:
        cam.is_active = cam_in.is_active

    db.commit()
    db.refresh(cam)
    return {
        "id": cam.id,
        "name": cam.name,
        "location": cam.location,
        "source_type": cam.source_type,
        "source_url": cam.source_url,
        "status": cam.status,
        "fps": cam.fps,
        "resolution": cam.resolution,
        "is_active": cam.is_active,
        "created_at": cam.created_at,
        "people_count": 2,
        "vehicle_count": 1,
        "active_alerts_count": 0
    }

@router.delete("/{cam_id}")
def delete_camera(cam_id: str, db: Session = Depends(get_db)):
    cam = db.query(models.Camera).filter(models.Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    db.delete(cam)
    db.commit()
    return {"success": True, "message": f"Camera {cam_id} deleted"}

@router.post("/{cam_id}/test")
def test_camera_connection(cam_id: str, db: Session = Depends(get_db)):
    cam = db.query(models.Camera).filter(models.Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    if cam.source_type == "DEMO_VIDEO":
        return {"status": "SUCCESS", "latency_ms": 12, "message": "Synthetic demo border stream active."}
    elif cam.source_type == "WEBCAM":
        cap = cv2.VideoCapture(0)
        opened = cap.isOpened()
        if opened:
            cap.release()
            return {"status": "SUCCESS", "latency_ms": 28, "message": "Local webcam accessible."}
        return {"status": "FAILED", "message": "Webcam device 0 not accessible or currently in use."}
    elif cam.source_type == "LOCAL_VIDEO":
        if cam.source_url and os.path.exists(cam.source_url):
            return {"status": "SUCCESS", "latency_ms": 15, "message": "Local video file verified."}
        return {"status": "FAILED", "message": f"File path '{cam.source_url}' does not exist on disk."}
    else: # RTSP
        return {"status": "SUCCESS", "latency_ms": 45, "message": f"RTSP stream endpoint {cam.source_url} handshake simulated successfully."}
