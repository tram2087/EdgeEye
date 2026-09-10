import time
import cv2
import logging
from typing import Dict
from fastapi import APIRouter, Response, HTTPException
from fastapi.responses import StreamingResponse

logger = logging.getLogger("EdgeEye.Stream")
router = APIRouter(prefix="/api/cameras", tags=["Live Stream"])

# Reference to global event engine, injected in main.py
event_engine = None

# Active viewers tracking per camera
active_viewers: Dict[str, int] = {}

def set_global_engine(engine):
    global event_engine
    event_engine = engine

def generate_frames(cam_id: str):
    """
    Generator yielding MJPEG multipart stream frames.
    Handles disconnection cleanly and tracks active stream subscribers.
    """
    global event_engine, active_viewers
    active_viewers[cam_id] = active_viewers.get(cam_id, 0) + 1
    logger.info(f"Stream opened for camera {cam_id} (Active viewers: {active_viewers[cam_id]})")

    try:
        while True:
            if event_engine is not None:
                try:
                    res = event_engine.process_camera_frame(cam_id)
                    frame = res.get("annotated_frame")
                    if frame is None or frame.size == 0:
                        time.sleep(0.05)
                        continue

                    # Encode to JPEG with quality 70 for CPU speed
                    ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                    if not ret:
                        time.sleep(0.04)
                        continue

                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                    # Maintain ~25 FPS pacing
                    time.sleep(0.04)
                except GeneratorExit:
                    break
                except Exception as e:
                    logger.error(f"Stream generation error for {cam_id}: {e}")
                    time.sleep(0.1)
            else:
                time.sleep(0.1)
    finally:
        active_viewers[cam_id] = max(0, active_viewers.get(cam_id, 1) - 1)
        logger.info(f"Stream closed for camera {cam_id} (Active viewers: {active_viewers[cam_id]})")

@router.get("/{cam_id}/stream")
def stream_camera(cam_id: str):
    return StreamingResponse(
        generate_frames(cam_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/{cam_id}/snapshot")
def get_snapshot(cam_id: str):
    global event_engine
    if event_engine:
        if cam_id not in event_engine.processors:
            event_engine.register_camera(cam_id)
        proc = event_engine.processors[cam_id]
        frame = proc.last_frame
        if frame is None:
            ret, frame = proc.read_frame()
        if frame is not None and frame.size > 0:
            ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if ret:
                return Response(content=buffer.tobytes(), media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="No active snapshot available for camera")

@router.get("/{cam_id}/preview")
def get_preview(cam_id: str):
    """
    Returns a lightweight, downscaled snapshot (480x270) for overview dashboards.
    Consumes minimal CPU compared to full video streaming.
    """
    global event_engine
    if event_engine:
        if cam_id not in event_engine.processors:
            event_engine.register_camera(cam_id)
        proc = event_engine.processors[cam_id]
        frame = proc.last_frame
        if frame is None:
            ret, frame = proc.read_frame()
        if frame is not None and frame.size > 0:
            small = cv2.resize(frame, (480, 270), interpolation=cv2.INTER_LINEAR)
            ret, buffer = cv2.imencode('.jpg', small, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
            if ret:
                return Response(content=buffer.tobytes(), media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="Preview unavailable")


