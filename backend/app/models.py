import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="OPERATOR") # ADMIN, OPERATOR, VIEWER
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(50), primary_key=True, index=True) # e.g. "BOP-01"
    name = Column(String(100), nullable=False) # e.g. "Sector Alpha - Main Fence"
    location = Column(String(100), nullable=False) # e.g. "Sector Alpha"
    source_type = Column(String(50), default="DEMO_VIDEO") # DEMO_VIDEO, LOCAL_VIDEO, WEBCAM, RTSP
    source_url = Column(String(255), nullable=True)
    status = Column(String(50), default="ONLINE") # ONLINE, OFFLINE, WARNING
    fps = Column(Integer, default=25)
    resolution = Column(String(50), default="1920x1080")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    zones = relationship("Zone", back_populates="camera", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="camera", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="camera", cascade="all, delete-orphan")

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    name = Column(String(100), nullable=False) # e.g. "Red Line Buffer"
    zone_type = Column(String(50), default="RESTRICTED") # RESTRICTED, WARNING, PERIMETER
    coordinates = Column(Text, nullable=False) # JSON string: "[[x1,y1],[x2,y2],...]"
    severity = Column(String(50), default="CRITICAL") # INFO, WARNING, HIGH, CRITICAL
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    camera = relationship("Camera", back_populates="zones")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    event_type = Column(String(50), nullable=False) # INTRUSION, PERSON_DETECTED, VEHICLE_DETECTED, NIGHT_MOVEMENT, PLATE_DETECTED, WATCHLIST_MATCH, LOITERING, WRONG_DIRECTION, UNATTENDED_OBJECT
    object_id = Column(String(50), nullable=True) # e.g. "Person #12"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    confidence = Column(Float, default=0.90)
    severity = Column(String(50), default="HIGH") # INFO, WARNING, HIGH, CRITICAL
    status = Column(String(50), default="NEW") # NEW, ACKNOWLEDGED, RESOLVED
    snapshot_path = Column(String(255), nullable=True)
    metadata_json = Column(Text, nullable=True) # JSON details, e.g. dwell time, plate text, speed

    camera = relationship("Camera", back_populates="events")
    alert = relationship("Alert", back_populates="event", uselist=False)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="HIGH") # INFO, WARNING, HIGH, CRITICAL
    status = Column(String(50), default="UNACKNOWLEDGED") # UNACKNOWLEDGED, ACKNOWLEDGED, RESOLVED
    acknowledged_by = Column(String(50), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    camera = relationship("Camera", back_populates="alerts")
    event = relationship("Event", back_populates="alert")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(50), nullable=False, index=True)
    object_id = Column(String(50), nullable=True)
    class_name = Column(String(50), nullable=False) # person, car, motorcycle, bus, truck
    confidence = Column(Float, nullable=False)
    bbox_json = Column(Text, nullable=False) # "[x1, y1, x2, y2]"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class Plate(Base):
    __tablename__ = "plates"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(50), index=True, nullable=False)
    vehicle_type = Column(String(50), default="Car")
    camera_id = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    confidence = Column(Float, default=0.92)
    status = Column(String(50), default="AUTHORIZED") # AUTHORIZED, WATCHLIST, UNKNOWN
    snapshot_path = Column(String(255), nullable=True)

class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(50), unique=True, index=True, nullable=False)
    reason = Column(String(255), nullable=False)
    severity = Column(String(50), default="CRITICAL") # HIGH, CRITICAL
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
