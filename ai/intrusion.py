import json
import logging
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger("IBVAP.AI.Intrusion")

class VirtualFenceDetector:
    def __init__(self):
        # camera_id -> list of zones: [{"id": int, "name": str, "type": str, "points": [(x,y), ...], "severity": str}]
        self.camera_zones: Dict[str, List[Dict[str, Any]]] = {}
        # track_id -> dict of zone dwell start times: {zone_id: start_timestamp}
        self.dwell_tracker: Dict[int, Dict[int, float]] = {}

    def set_zones(self, camera_id: str, zones_data: List[Dict[str, Any]]):
        """
        Configures zones for a given camera.
        zones_data should be a list of zone dicts with coordinates JSON.
        """
        parsed_zones = []
        for z in zones_data:
            coords = z.get("coordinates")
            if isinstance(coords, str):
                try:
                    coords = json.loads(coords)
                except Exception:
                    coords = []
            
            parsed_zones.append({
                "id": z.get("id"),
                "name": z.get("name", "Restricted Area"),
                "zone_type": z.get("zone_type", "RESTRICTED"),
                "severity": z.get("severity", "CRITICAL"),
                "enabled": z.get("enabled", True),
                "points": coords # list of [x, y]
            })
        self.camera_zones[camera_id] = parsed_zones

    @staticmethod
    def point_in_polygon(x: float, y: float, polygon: List[List[float]]) -> bool:
        """
        Ray-casting algorithm to determine if point (x, y) is inside polygon.
        Coordinates can be normalized (0.0 to 1.0) or absolute pixels.
        """
        n = len(polygon)
        if n < 3:
            return False
        inside = False
        p1x, p1y = polygon[0]
        for i in range(n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    def check_intrusions(
        self,
        camera_id: str,
        tracked_objects: List[Dict[str, Any]],
        frame_shape: Tuple[int, int],
        current_time: float,
        loitering_threshold: float = 10.0
    ) -> List[Dict[str, Any]]:
        """
        Evaluates tracked objects against camera zones.
        Returns triggered intrusion / loitering events.
        """
        events = []
        zones = self.camera_zones.get(camera_id, [])
        if not zones:
            return events

        h, w = frame_shape[:2]

        for obj in tracked_objects:
            track_id = obj["track_id"]
            # Bottom center of bounding box gives most accurate ground footprint
            bx1, by1, bx2, by2 = obj["bbox"]
            foot_x = (bx1 + bx2) / 2.0
            foot_y = by2

            # Check normalization
            is_normalized = (foot_x <= 1.0 and foot_y <= 1.0)
            norm_x = foot_x if is_normalized else (foot_x / float(w) if w > 0 else 0)
            norm_y = foot_y if is_normalized else (foot_y / float(h) if h > 0 else 0)

            if track_id not in self.dwell_tracker:
                self.dwell_tracker[track_id] = {}

            for zone in zones:
                if not zone.get("enabled", True):
                    continue

                poly = zone.get("points", [])
                if len(poly) < 3:
                    continue

                # Determine if polygon points are normalized
                poly_is_norm = all(p[0] <= 1.0 and p[1] <= 1.0 for p in poly)
                test_x = norm_x if poly_is_norm else foot_x
                test_y = norm_y if poly_is_norm else foot_y

                is_inside = self.point_in_polygon(test_x, test_y, poly)
                zone_id = zone["id"]

                if is_inside:
                    # Mark object as inside zone
                    if zone_id not in self.dwell_tracker[track_id]:
                        # NEW ENTRY EVENT
                        self.dwell_tracker[track_id][zone_id] = current_time
                        events.append({
                            "event_type": "INTRUSION",
                            "camera_id": camera_id,
                            "zone_id": zone_id,
                            "zone_name": zone["name"],
                            "object_id": obj["label"],
                            "class_name": obj["class_name"],
                            "severity": zone.get("severity", "CRITICAL"),
                            "confidence": 0.94,
                            "description": f"{obj['label']} breached virtual perimeter in {zone['name']}.",
                            "bbox": obj["bbox"]
                        })
                    else:
                        # Check Loitering
                        dwell_duration = current_time - self.dwell_tracker[track_id][zone_id]
                        if dwell_duration >= loitering_threshold and dwell_duration < (loitering_threshold + 1.0):
                            events.append({
                                "event_type": "LOITERING",
                                "camera_id": camera_id,
                                "zone_id": zone_id,
                                "zone_name": zone["name"],
                                "object_id": obj["label"],
                                "class_name": obj["class_name"],
                                "severity": "HIGH",
                                "confidence": 0.91,
                                "description": f"{obj['label']} loitering inside {zone['name']} for {int(dwell_duration)} seconds.",
                                "bbox": obj["bbox"]
                            })
                else:
                    # If previously in zone, remove
                    if zone_id in self.dwell_tracker[track_id]:
                        del self.dwell_tracker[track_id][zone_id]

        return events
