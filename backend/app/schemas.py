from pydantic import BaseModel, Field
from typing import Optional, List, Any
import datetime

# User schemas
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    token: str

# Camera schemas
class CameraBase(BaseModel):
    id: str
    name: str
    location: str
    source_type: str = "DEMO_VIDEO"
    source_url: Optional[str] = None
    status: str = "ONLINE"
    fps: int = 25
    resolution: str = "1920x1080"
    is_active: bool = True

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    source_type: Optional[str] = None
    source_url: Optional[str] = None
    status: Optional[str] = None
    fps: Optional[int] = None
    resolution: Optional[str] = None
    is_active: Optional[bool] = None

class CameraResponse(CameraBase):
    created_at: datetime.datetime
    people_count: int = 0
    vehicle_count: int = 0
    active_alerts_count: int = 0

    class Config:
        from_attributes = True

# Zone schemas
class ZoneBase(BaseModel):
    camera_id: str
    name: str
    zone_type: str = "RESTRICTED"
    coordinates: str # JSON string e.g. "[[0.2,0.3],[0.8,0.3],[0.8,0.7],[0.2,0.7]]"
    severity: str = "CRITICAL"
    enabled: bool = True

class ZoneCreate(ZoneBase):
    pass

class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    zone_type: Optional[str] = None
    coordinates: Optional[str] = None
    severity: Optional[str] = None
    enabled: Optional[bool] = None

class ZoneResponse(ZoneBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Event schemas
class EventBase(BaseModel):
    camera_id: str
    event_type: str
    object_id: Optional[str] = None
    confidence: float = 0.90
    severity: str = "HIGH"
    status: str = "NEW"
    snapshot_path: Optional[str] = None
    metadata_json: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: int
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

# Alert schemas
class AlertBase(BaseModel):
    camera_id: str
    event_id: Optional[int] = None
    title: str
    message: str
    severity: str = "HIGH"
    status: str = "UNACKNOWLEDGED"

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    acknowledged_by: Optional[str] = None

class AlertResponse(AlertBase):
    id: int
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    snapshot_path: Optional[str] = None

    class Config:
        from_attributes = True

# Detection schemas
class DetectionItem(BaseModel):
    class_name: str
    confidence: float
    bbox: List[float] # [x1, y1, x2, y2] normalized or pixel
    track_id: Optional[int] = None
    label: Optional[str] = None

# ANPR schemas
class PlateScan(BaseModel):
    plate_number: str
    vehicle_type: str = "Car"
    camera_id: str
    confidence: float = 0.92
    status: str = "AUTHORIZED" # AUTHORIZED, WATCHLIST, UNKNOWN
    snapshot_path: Optional[str] = None

class PlateResponse(PlateScan):
    id: int
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

# Watchlist schemas
class WatchlistCreate(BaseModel):
    plate_number: str
    reason: str
    severity: str = "CRITICAL"
    description: Optional[str] = None
    active: bool = True

class WatchlistResponse(WatchlistCreate):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Settings schemas
class SystemSettings(BaseModel):
    detection_confidence: float = 0.45
    night_start_time: str = "20:00"
    night_end_time: str = "05:00"
    loitering_threshold_seconds: int = 10
    default_alert_severity: str = "HIGH"
    enable_sound_alerts: bool = True
    demo_mode: bool = True
    enable_gpu: bool = False
    anpr_ocr_engine: str = "Rule-based & Regex Pipeline"
