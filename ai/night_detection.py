import cv2
import numpy as np
import datetime
from typing import Tuple, Dict, Any, List

class NightMovementDetector:
    def __init__(self, night_start: str = "20:00", night_end: str = "05:00", luminance_threshold: float = 65.0):
        self.night_start = night_start
        self.night_end = night_end
        self.luminance_threshold = luminance_threshold
        self.prev_gray_frames: Dict[str, np.ndarray] = {}

    def is_night_time(self) -> bool:
        """
        Checks if current local time falls into night operational window.
        """
        now = datetime.datetime.now().time()
        start = datetime.datetime.strptime(self.night_start, "%H:%M").time()
        end = datetime.datetime.strptime(self.night_end, "%H:%M").time()

        if start > end:
            # Over midnight (e.g. 20:00 to 05:00)
            return now >= start or now <= end
        else:
            return start <= now <= end

    def calculate_luminance(self, frame: np.ndarray) -> float:
        """
        Computes the average perceived brightness (luminance) of the video frame.
        """
        if frame is None or frame.size == 0:
            return 100.0
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
        return float(np.mean(gray))

    def evaluate_frame(
        self,
        camera_id: str,
        frame: np.ndarray,
        tracked_objects: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Detects movement occurring under low-light or scheduled night conditions.
        """
        events = []
        luminance = self.calculate_luminance(frame)
        is_low_light = luminance < self.luminance_threshold or self.is_night_time()

        if not is_low_light:
            return events

        # If low light and any person or vehicle is actively moving
        for obj in tracked_objects:
            if obj.get("speed", 0.0) > 1.5 or obj.get("dwell_time", 0.0) > 2.0:
                events.append({
                    "event_type": "NIGHT_MOVEMENT",
                    "camera_id": camera_id,
                    "object_id": obj["label"],
                    "severity": "HIGH",
                    "confidence": 0.88,
                    "luminance": round(luminance, 1),
                    "description": f"Low-light movement detected: {obj['label']} active in sector (Ambient luminance: {int(luminance)}/255).",
                    "bbox": obj["bbox"]
                })
        return events
