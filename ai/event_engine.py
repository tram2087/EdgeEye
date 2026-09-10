import os
import time
import json
import logging
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app import models
from ai.detector import ObjectDetector
from ai.tracker import ObjectTracker
from ai.intrusion import VirtualFenceDetector
from ai.night_detection import NightMovementDetector
from ai.anpr import ANPREngine
from ai.video_processor import VideoStreamProcessor

import os
import time
import json
import logging
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app import models
from ai.detector import ObjectDetector
from ai.tracker import ObjectTracker
from ai.intrusion import VirtualFenceDetector
from ai.night_detection import NightMovementDetector
from ai.anpr import ANPREngine
from ai.video_processor import VideoStreamProcessor

logger = logging.getLogger("EdgeEye.AI.EventEngine")

class AnalyticsEventEngine:
    def __init__(self, db_session_factory):
        self.db_session_factory = db_session_factory
        self.detector = ObjectDetector()  # Singleton YOLOv8
        self.trackers: Dict[str, ObjectTracker] = {}
        self.fence_detector = VirtualFenceDetector()
        self.night_detector = NightMovementDetector()
        self.anpr_engine = ANPREngine()
        self.processors: Dict[str, VideoStreamProcessor] = {}

        # Mode toggles:
        # demo_mode = True: Uses lightweight simulated detections for DEMO_VIDEO, saving 95% CPU
        # live_ai_inference = False: When True, runs real YOLOv8 inference with frame skipping (3-4 FPS max)
        self.demo_mode = True
        self.live_ai_inference = False
        self.target_inference_fps = 4.0  # Max 4 AI inferences per second
        self.last_inference_time: Dict[str, float] = {}
        self.cached_detections: Dict[str, List[Dict[str, Any]]] = {}

        # In-memory cached watchlist (refresh every 15s to prevent per-frame DB hits)
        self.cached_watchlist: List[str] = []
        self.last_watchlist_sync: float = 0.0

        # WebSocket active subscriber connections
        self.active_websockets = []
        # In-memory recent alerts buffer for fast polling fallback
        self.recent_alerts = []
        self.recent_events = []

        # Throttle alert spam for the same object/zone
        self.last_alert_times = {}

    def set_ai_mode(self, live_ai: bool):
        self.live_ai_inference = live_ai
        logger.info(f"AI Execution Mode updated: live_ai_inference={live_ai}, demo_mode={self.demo_mode}")

    def set_demo_mode(self, demo: bool):
        self.demo_mode = demo
        logger.info(f"Demo Mode updated: demo_mode={demo}")

    def register_camera(self, camera_id: str, source_type: str = "DEMO_VIDEO", source_url: Optional[str] = None):
        if camera_id not in self.processors:
            self.processors[camera_id] = VideoStreamProcessor(camera_id, source_type, source_url)
        if camera_id not in self.trackers:
            self.trackers[camera_id] = ObjectTracker()

    def sync_zones_from_db(self):
        db = self.db_session_factory()
        try:
            zones = db.query(models.Zone).filter(models.Zone.enabled == True).all()
            camera_zones = {}
            for z in zones:
                if z.camera_id not in camera_zones:
                    camera_zones[z.camera_id] = []
                camera_zones[z.camera_id].append({
                    "id": z.id,
                    "name": z.name,
                    "zone_type": z.zone_type,
                    "severity": z.severity,
                    "enabled": z.enabled,
                    "coordinates": z.coordinates
                })
            for cam_id, zlist in camera_zones.items():
                self.fence_detector.set_zones(cam_id, zlist)
        except Exception as e:
            logger.error(f"Error syncing zones from DB: {e}")
        finally:
            db.close()

    def _sync_watchlist_if_needed(self, now_ts: float):
        if now_ts - self.last_watchlist_sync > 15.0:
            db = self.db_session_factory()
            try:
                self.cached_watchlist = [
                    w.plate_number for w in db.query(models.Watchlist).filter(models.Watchlist.active == True).all()
                ]
                self.last_watchlist_sync = now_ts
            except Exception as e:
                logger.error(f"Error syncing watchlist: {e}")
            finally:
                db.close()

    def process_camera_frame(self, camera_id: str) -> Dict[str, Any]:
        """
        Executes optimized AI video analytics pipeline:
        - Checks frame-skipping throttle (max 4 FPS for real YOLO)
        - In Demo Mode, computes detections directly from synthetic entities (0% CPU)
        - Uses cached detections between throttled frames
        - Caches DB watchlist in memory
        - Event-driven evidence snapshotting only
        """
        if camera_id not in self.processors:
            self.register_camera(camera_id)

        processor = self.processors[camera_id]
        tracker = self.trackers[camera_id]
        ret, frame = processor.read_frame()
        if not ret or frame is None:
            return {"success": False, "annotated_frame": None, "detections": [], "alerts": []}

        now_ts = time.time()
        now_dt = datetime.datetime.utcnow()
        self._sync_watchlist_if_needed(now_ts)

        # 1. AI Detection with Frame Skipping & CPU Optimization
        is_demo_source = processor.source_type == "DEMO_VIDEO"

        if self.demo_mode and is_demo_source and not self.live_ai_inference:
            # CPU Optimized Demo Mode: extract detections directly from simulated entities (0% CPU impact)
            detections = []
            for ent in processor.sim_entities:
                x, y = ent["x"], ent["y"]
                if ent["type"] == "person":
                    detections.append({
                        "bbox": [x - 20, y - 50, x + 20, y + 25],
                        "class_id": 0,
                        "class_name": "person",
                        "confidence": 0.94
                    })
                elif ent["type"] in ["car", "truck"]:
                    detections.append({
                        "bbox": [x - 50, y - 35, x + 50, y + 15],
                        "class_id": 2 if ent["type"] == "car" else 7,
                        "class_name": ent["type"],
                        "confidence": 0.92
                    })
            self.cached_detections[camera_id] = detections
        else:
            # Real YOLOv8 AI inference with frame skipping (3-4 FPS max)
            last_inf = self.last_inference_time.get(camera_id, 0.0)
            inference_interval = 1.0 / self.target_inference_fps  # e.g. 0.25s

            if (now_ts - last_inf) >= inference_interval:
                if self.detector.is_real_model:
                    detections = self.detector.detect(frame)
                else:
                    detections = []
                self.cached_detections[camera_id] = detections
                self.last_inference_time[camera_id] = now_ts
            else:
                # Reuse cached detections for intermediate frames
                detections = self.cached_detections.get(camera_id, [])

        # 2. Tracking
        tracked = tracker.update(detections, now_ts)

        # 3. Virtual Fence Intrusions
        intrusion_events = self.fence_detector.check_intrusions(
            camera_id=camera_id,
            tracked_objects=tracked,
            frame_shape=frame.shape[:2],
            current_time=now_ts
        )

        # 4. Night Movement
        night_events = self.night_detector.evaluate_frame(
            camera_id=camera_id,
            frame=frame,
            tracked_objects=tracked
        )

        # 5. ANPR & Watchlist check for vehicles
        anpr_events = []
        for obj in tracked:
            if obj["class_name"] in ["car", "truck", "bus"]:
                anpr_res = self.anpr_engine.process_vehicle_crop(frame, obj["bbox"], self.cached_watchlist)
                if anpr_res and anpr_res.get("plate_number"):
                    plate_num = anpr_res["plate_number"]
                    status = anpr_res["status"]
                    plate_key = f"{camera_id}_{plate_num}"
                    if plate_key not in self.last_alert_times or (now_ts - self.last_alert_times[plate_key]) > 60:
                        self.last_alert_times[plate_key] = now_ts
                        try:
                            db = self.db_session_factory()
                            plate_rec = models.Plate(
                                plate_number=plate_num,
                                vehicle_type=obj["class_name"].capitalize(),
                                camera_id=camera_id,
                                timestamp=now_dt,
                                confidence=anpr_res["confidence"],
                                status=status
                            )
                            db.add(plate_rec)
                            db.commit()
                            db.close()
                        except Exception:
                            pass

                        if status == "WATCHLIST":
                            anpr_events.append({
                                "event_type": "WATCHLIST_MATCH",
                                "camera_id": camera_id,
                                "object_id": f"Plate {plate_num}",
                                "severity": "CRITICAL",
                                "confidence": 0.95,
                                "description": f"Target vehicle license plate matched watchlist: {plate_num}",
                                "bbox": obj["bbox"]
                            })

        # Combine all new events
        all_new_events = intrusion_events + night_events + anpr_events
        generated_alerts = []

        # 6. Dispatch & Persist Events & Alerts (Event-driven evidence ONLY)
        if all_new_events:
            db = self.db_session_factory()
            try:
                for ev in all_new_events:
                    ev_key = f"{camera_id}_{ev['event_type']}_{ev.get('object_id')}"
                    # Throttle repeat alerts for same object to every 15 seconds
                    if ev_key in self.last_alert_times and (now_ts - self.last_alert_times[ev_key]) < 15:
                        continue
                    self.last_alert_times[ev_key] = now_ts

                    # Evidence Snapshot (only saved on actual event)
                    snapshot_filename = processor.capture_evidence(frame, filename_prefix=ev["event_type"].lower())

                    # Save Event
                    db_event = models.Event(
                        camera_id=camera_id,
                        event_type=ev["event_type"],
                        object_id=ev.get("object_id"),
                        timestamp=now_dt,
                        confidence=ev.get("confidence", 0.90),
                        severity=ev.get("severity", "HIGH"),
                        status="NEW",
                        snapshot_path=snapshot_filename,
                        metadata_json=json.dumps(ev)
                    )
                    db.add(db_event)
                    db.flush()

                    # Save Alert
                    title_map = {
                        "INTRUSION": f"Perimeter Intrusion Detected — {camera_id}",
                        "LOITERING": f"Suspicious Loitering Detected — {camera_id}",
                        "NIGHT_MOVEMENT": f"Night Movement Detected — {camera_id}",
                        "WATCHLIST_MATCH": f"Watchlist Vehicle Identified — {camera_id}"
                    }
                    alert_title = title_map.get(ev["event_type"], f"Security Event — {camera_id}")

                    db_alert = models.Alert(
                        event_id=db_event.id,
                        camera_id=camera_id,
                        title=alert_title,
                        message=ev.get("description", "Security rule triggered."),
                        severity=ev.get("severity", "HIGH"),
                        status="UNACKNOWLEDGED",
                        created_at=now_dt
                    )
                    db.add(db_alert)
                    db.commit()

                    alert_payload = {
                        "id": db_alert.id,
                        "event_id": db_event.id,
                        "camera_id": camera_id,
                        "title": alert_title,
                        "message": db_alert.message,
                        "severity": db_alert.severity,
                        "status": db_alert.status,
                        "created_at": now_dt.isoformat(),
                        "snapshot_path": snapshot_filename
                    }
                    generated_alerts.append(alert_payload)
                    self.recent_alerts.insert(0, alert_payload)
                    if len(self.recent_alerts) > 50:
                        self.recent_alerts.pop()
            except Exception as e:
                logger.error(f"Error persisting event/alert: {e}")
                db.rollback()
            finally:
                db.close()

        # 7. Render Annotated Frame
        zones_for_cam = self.fence_detector.camera_zones.get(camera_id, [])
        annotated = processor.annotate_frame(frame, tracked, zones_for_cam, generated_alerts)

        return {
            "success": True,
            "annotated_frame": annotated,
            "raw_frame": frame,
            "tracked": tracked,
            "alerts": generated_alerts
        }

    def cleanup(self):
        """Cleanly releases all camera resources and capture devices."""
        logger.info("Cleaning up Video Analytics Event Engine resources...")
        for cid, proc in list(self.processors.items()):
            try:
                proc.release()
            except Exception:
                pass
        self.processors.clear()
        self.trackers.clear()

