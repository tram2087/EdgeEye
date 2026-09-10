import os
import cv2
import time
import math
import numpy as np
import datetime
from typing import Dict, Any, List, Optional, Tuple

class VideoStreamProcessor:
    def __init__(self, camera_id: str, source_type: str = "DEMO_VIDEO", source_url: Optional[str] = None):
        self.camera_id = camera_id
        self.source_type = source_type
        self.source_url = source_url
        self.cap = None
        self.frame_count = 0
        self.last_frame = None
        self.width = 1280
        self.height = 720
        self._init_source()

        # Synthetic animation state for DEMO_VIDEO
        self.sim_time = 0.0
        self.sim_entities = [
            {"type": "person", "x": 200, "y": 450, "vx": 1.2, "vy": 0.4, "label": "Person #1"},
            {"type": "person", "x": 750, "y": 400, "vx": -0.8, "vy": 0.6, "label": "Person #2"},
            {"type": "car", "x": 400, "y": 550, "vx": 2.5, "vy": 0.0, "label": "Vehicle #1"},
            {"type": "truck", "x": 1000, "y": 580, "vx": -1.8, "vy": 0.0, "label": "Vehicle #2"}
        ]

    def _init_source(self):
        if self.source_type in ["LOCAL_VIDEO", "RTSP"] and self.source_url:
            if os.path.exists(self.source_url) or self.source_url.startswith("rtsp://") or self.source_url.startswith("http"):
                self.cap = cv2.VideoCapture(self.source_url)
        elif self.source_type == "WEBCAM":
            try:
                cam_idx = int(self.source_url) if self.source_url and self.source_url.isdigit() else 0
                self.cap = cv2.VideoCapture(cam_idx)
            except Exception:
                self.cap = None

    def _generate_synthetic_border_frame(self) -> np.ndarray:
        """
        Creates a high-fidelity synthetic border security camera feed:
        - Border fence with barbed wire texture
        - Patrol road / arid border terrain
        - Watchtower silhouette
        - Simulated moving personnel and vehicles
        - Timecode and night/day ambient lighting
        """
        self.sim_time += 0.04
        t = self.sim_time

        # Base ground / sky gradient (night vision / dusk border patrol palette)
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        
        # Terrain
        frame[0:320, :] = [25, 20, 18] # Dark twilight sky
        frame[320:450, :] = [35, 38, 42] # Distant border hills
        frame[450:720, :] = [28, 32, 28] # Patrol ground / dirt road

        # Road markings
        cv2.line(frame, (0, 600), (self.width, 600), (55, 60, 55), 3)
        cv2.line(frame, (0, 670), (self.width, 670), (45, 50, 45), 2)

        # Border Fence (Vertical posts & diagonal wire)
        for fx in range(50, self.width, 100):
            cv2.line(frame, (fx, 360), (fx, 500), (70, 75, 80), 3)
        for fy in range(370, 500, 25):
            cv2.line(frame, (0, fy), (self.width, fy), (85, 90, 95), 1)

        # Watchtower structure in background
        cv2.rectangle(frame, (1050, 220), (1120, 380), (40, 45, 50), -1)
        cv2.line(frame, (1085, 180), (1085, 220), (60, 65, 70), 3) # Mast

        # Move and render simulated entities
        for ent in self.sim_entities:
            ent["x"] += ent["vx"]
            ent["y"] += ent["vy"]

            # Boundary bounces
            if ent["x"] > self.width - 100 or ent["x"] < 80:
                ent["vx"] *= -1
            if ent["y"] > self.height - 80 or ent["y"] < 380:
                ent["vy"] *= -1

            x = int(ent["x"])
            y = int(ent["y"])

            if ent["type"] == "person":
                # Draw person silhouette
                cv2.circle(frame, (x, y - 45), 10, (140, 160, 140), -1) # Head
                cv2.rectangle(frame, (x - 8, y - 35), (x + 8, y), (110, 130, 120), -1) # Torso
                cv2.line(frame, (x - 5, y), (x - 10, y + 25), (90, 100, 95), 4) # Leg 1
                cv2.line(frame, (x + 5, y), (x + 10, y + 25), (90, 100, 95), 4) # Leg 2
            elif ent["type"] == "car":
                # Draw vehicle
                cv2.rectangle(frame, (x - 45, y - 20), (x + 45, y + 10), (130, 100, 70), -1)
                cv2.rectangle(frame, (x - 30, y - 35), (x + 25, y - 20), (100, 80, 60), -1)
                cv2.circle(frame, (x - 25, y + 10), 8, (30, 30, 30), -1) # Wheel
                cv2.circle(frame, (x + 25, y + 10), 8, (30, 30, 30), -1) # Wheel
                # License plate
                cv2.rectangle(frame, (x + 35, y - 5), (x + 45, y + 5), (220, 220, 220), -1)
            elif ent["type"] == "truck":
                cv2.rectangle(frame, (x - 65, y - 35), (x + 30, y + 15), (70, 90, 110), -1)
                cv2.rectangle(frame, (x + 30, y - 20), (x + 65, y + 15), (90, 110, 130), -1)
                cv2.circle(frame, (x - 40, y + 15), 10, (30, 30, 30), -1)
                cv2.circle(frame, (x + 10, y + 15), 10, (30, 30, 30), -1)
                cv2.circle(frame, (x + 50, y + 15), 10, (30, 30, 30), -1)

        return frame

    def read_frame(self) -> Tuple[bool, np.ndarray]:
        """
        Reads next frame from actual video source or synthetic generator.
        """
        self.frame_count += 1
        if self.cap is not None and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                self.last_frame = frame
                return True, frame
            else:
                # Loop back to beginning for demonstration loops
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.cap.read()
                if ret:
                    self.last_frame = frame
                    return True, frame

        # Use synthetic border surveillance stream
        frame = self._generate_synthetic_border_frame()
        self.last_frame = frame
        return True, frame

    def annotate_frame(
        self,
        frame: np.ndarray,
        tracked_objects: List[Dict[str, Any]],
        zones: List[Dict[str, Any]],
        active_alerts: List[Dict[str, Any]]
    ) -> np.ndarray:
        """
        Renders bounding boxes, tracking labels, virtual fence polygons, and SOC HUD overlay.
        """
        annotated = frame.copy()
        h, w = frame.shape[:2]

        # 1. Render Virtual Fence / Restricted Zones
        for zone in zones:
            pts = zone.get("points", [])
            if len(pts) >= 3:
                # Convert normalized coords if necessary
                pixel_pts = []
                for p in pts:
                    px = int(p[0] * w if p[0] <= 1.0 else p[0])
                    py = int(p[1] * h if p[1] <= 1.0 else p[1])
                    pixel_pts.append([px, py])
                
                pts_arr = np.array(pixel_pts, np.int32).reshape((-1, 1, 2))
                
                # Highlight in Red if active breach, else Amber
                color = (0, 0, 220) if zone.get("severity") == "CRITICAL" else (0, 165, 255)
                overlay = annotated.copy()
                cv2.fillPoly(overlay, [pts_arr], color)
                cv2.addWeighted(overlay, 0.20, annotated, 0.80, 0, annotated)
                cv2.polylines(annotated, [pts_arr], True, color, 2)
                
                # Zone label
                centroid_x = int(np.mean([p[0] for p in pixel_pts]))
                centroid_y = int(np.mean([p[1] for p in pixel_pts]))
                label_text = f"ZONE: {zone.get('name', 'RESTRICTED')}"
                cv2.putText(annotated, label_text, (centroid_x - 60, centroid_y),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

        # 2. Render Tracked Objects
        for obj in tracked_objects:
            bx1, by1, bx2, by2 = [int(v) for v in obj["bbox"]]
            cls_name = obj["class_name"]
            track_label = obj["label"]
            
            # Color code: Person (Green/Amber), Vehicle (Cyan)
            box_color = (0, 220, 120) if cls_name == "person" else (240, 160, 40)
            
            # Check if object is in any alert
            is_in_alert = any(obj["label"] in a.get("message", "") or obj["label"] in a.get("title", "") for a in active_alerts)
            if is_in_alert:
                box_color = (0, 0, 255) # Bright Red

            cv2.rectangle(annotated, (bx1, by1), (bx2, by2), box_color, 2)
            
            # Tag label
            tag = f"{track_label} | {obj.get('speed', 0)} px/s"
            cv2.rectangle(annotated, (bx1, max(0, by1 - 22)), (bx1 + len(tag) * 9, by1), box_color, -1)
            cv2.putText(annotated, tag, (bx1 + 3, max(14, by1 - 6)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

        # 3. Security HUD Telemetry
        cv2.rectangle(annotated, (10, 10), (320, 75), (20, 25, 30), -1)
        cv2.rectangle(annotated, (10, 10), (320, 75), (60, 70, 80), 1)
        
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(annotated, f"CAM: {self.camera_id} [LIVE]", (20, 32),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.50, (0, 255, 120), 1)
        cv2.putText(annotated, f"TIME: {now_str}", (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 200, 200), 1)
        cv2.putText(annotated, f"TRACKS: {len(tracked_objects)} | ALERTS: {len(active_alerts)}", (20, 68),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 200, 255), 1)

        return annotated

    def capture_evidence(self, frame: np.ndarray, filename_prefix: str = "evidence") -> str:
        """
        Saves snapshot to evidence/ directory and returns relative path.
        """
        evidence_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "evidence"))
        os.makedirs(evidence_dir, exist_ok=True)

        timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:19]
        filename = f"{filename_prefix}_{self.camera_id}_{timestamp_str}.jpg"
        filepath = os.path.join(evidence_dir, filename)

        if frame is not None and frame.size > 0:
            cv2.imwrite(filepath, frame)
        return filename

    def release(self):
        """Releases underlying video capture resources."""
        if self.cap is not None:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None
        self.last_frame = None
