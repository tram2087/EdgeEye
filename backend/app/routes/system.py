from fastapi import APIRouter
import psutil
import datetime
from backend.app import schemas

router = APIRouter(prefix="/api", tags=["System"])

# In-memory settings state
SYSTEM_SETTINGS = {
    "detection_confidence": 0.45,
    "night_start_time": "20:00",
    "night_end_time": "05:00",
    "loitering_threshold_seconds": 10,
    "default_alert_severity": "HIGH",
    "enable_sound_alerts": True,
    "demo_mode": True,
    "enable_gpu": False,
    "anpr_ocr_engine": "Rule-based & Regex Pipeline (Fail-Safe)"
}

event_engine = None

def set_global_engine(engine):
    global event_engine
    event_engine = engine

@router.get("/health")
def health():
    return {
        "status": "HEALTHY",
        "service": "EdgeEye Backend & Video Analytics",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "version": "1.0.0-SIH2026"
    }

@router.get("/system/status")
def system_status():
    global event_engine
    cpu_percent = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    
    live_ai = event_engine.live_ai_inference if event_engine else False
    demo_active = event_engine.demo_mode if event_engine else True

    return {
        "platform": "EdgeEye — Intelligent Border Video Analytics Platform",
        "mode": "DEMO (CPU OPTIMIZED)" if demo_active and not live_ai else "LIVE AI INFERENCE (YOLOv8)",
        "ai_status": "OPERATIONAL",
        "live_ai_inference": live_ai,
        "demo_mode": demo_active,
        "ai_framework": "Ultralytics YOLOv8n (CPU Throttled 4 FPS) + Centroid/IoU Tracker",
        "cpu_usage_pct": cpu_percent,
        "memory_usage_pct": mem.percent,
        "storage_available_gb": round(psutil.disk_usage('.').free / (1024**3), 1),
        "active_stream_workers": 1,
        "anpr_status": "ACTIVE",
        "virtual_fence_status": "ACTIVE",
        "night_detection_status": "SCHEDULED"
    }

@router.get("/settings")
def get_settings():
    return SYSTEM_SETTINGS

@router.post("/settings")
def update_settings(settings: schemas.SystemSettings):
    global SYSTEM_SETTINGS, event_engine
    SYSTEM_SETTINGS = settings.model_dump()
    if event_engine:
        event_engine.set_demo_mode(SYSTEM_SETTINGS.get("demo_mode", True))
    return {"success": True, "settings": SYSTEM_SETTINGS}

@router.post("/settings/ai_mode")
def set_ai_mode(payload: dict):
    global event_engine
    live_ai = bool(payload.get("live_ai", False))
    if event_engine:
        event_engine.set_ai_mode(live_ai)
    return {"success": True, "live_ai": live_ai}

