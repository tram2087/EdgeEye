import time
import math
from typing import List, Dict, Any, Tuple

class TrackedObject:
    def __init__(self, track_id: int, class_name: str, bbox: List[float], timestamp: float):
        self.track_id = track_id
        self.class_name = class_name
        self.bbox = bbox # [x1, y1, x2, y2]
        self.first_seen = timestamp
        self.last_seen = timestamp
        self.centroids = [self._calculate_centroid(bbox)]
        self.dwell_time = 0.0
        self.direction = "STATIONARY" # NORTH, SOUTH, EAST, WEST, etc.
        self.speed = 0.0 # pixels per second
        self.disappeared_frames = 0
        self.in_zones = set() # Set of zone IDs object currently occupies

    def _calculate_centroid(self, bbox: List[float]) -> Tuple[float, float]:
        x1, y1, x2, y2 = bbox
        return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)

    def update(self, bbox: List[float], timestamp: float):
        self.bbox = bbox
        self.last_seen = timestamp
        self.dwell_time = self.last_seen - self.first_seen
        self.disappeared_frames = 0
        
        new_centroid = self._calculate_centroid(bbox)
        if len(self.centroids) > 0:
            prev_centroid = self.centroids[-1]
            dx = new_centroid[0] - prev_centroid[0]
            dy = new_centroid[1] - prev_centroid[1]
            dist = math.hypot(dx, dy)
            self.speed = round(dist / max(0.01, timestamp - self.last_seen + 0.03), 1)

            # Determine dominant direction
            if abs(dx) > abs(dy):
                self.direction = "EAST" if dx > 0 else "WEST"
            else:
                self.direction = "SOUTH" if dy > 0 else "NORTH"

        self.centroids.append(new_centroid)
        if len(self.centroids) > 30:
            self.centroids.pop(0)

class ObjectTracker:
    def __init__(self, max_disappeared: int = 15, max_distance: float = 80.0):
        self.next_track_id = 1
        self.tracked_objects: Dict[int, TrackedObject] = {}
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance

    def _calculate_centroid(self, bbox: List[float]) -> Tuple[float, float]:
        x1, y1, x2, y2 = bbox
        return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)

    def _calculate_iou(self, boxA: List[float], boxB: List[float]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

        iou = interArea / float(boxAArea + boxBArea - interArea + 1e-6)
        return iou

    def update(self, detections: List[Dict[str, Any]], timestamp: float = None) -> List[Dict[str, Any]]:
        """
        Takes raw detections and returns list of tracked objects with IDs.
        """
        if timestamp is None:
            timestamp = time.time()

        if len(detections) == 0:
            to_remove = []
            for track_id, obj in self.tracked_objects.items():
                obj.disappeared_frames += 1
                if obj.disappeared_frames > self.max_disappeared:
                    to_remove.append(track_id)
            for track_id in to_remove:
                del self.tracked_objects[track_id]
            return []

        # If no active tracks, initialize all detections
        if len(self.tracked_objects) == 0:
            for det in detections:
                t_obj = TrackedObject(self.next_track_id, det["class_name"], det["bbox"], timestamp)
                self.tracked_objects[self.next_track_id] = t_obj
                self.next_track_id += 1
        else:
            track_ids = list(self.tracked_objects.keys())
            matched_tracks = set()
            matched_detections = set()

            # First match using IoU
            for det_idx, det in enumerate(detections):
                best_iou = 0.3 # IoU threshold
                best_track_id = None
                for track_id in track_ids:
                    if track_id in matched_tracks:
                        continue
                    obj = self.tracked_objects[track_id]
                    if obj.class_name != det["class_name"]:
                        continue
                    iou = self._calculate_iou(obj.bbox, det["bbox"])
                    if iou > best_iou:
                        best_iou = iou
                        best_track_id = track_id
                
                if best_track_id is not None:
                    matched_tracks.add(best_track_id)
                    matched_detections.add(det_idx)
                    self.tracked_objects[best_track_id].update(det["bbox"], timestamp)

            # Match remaining using centroid distance
            unmatched_tracks = [tid for tid in track_ids if tid not in matched_tracks]
            unmatched_dets = [i for i in range(len(detections)) if i not in matched_detections]

            for det_idx in unmatched_dets:
                det = detections[det_idx]
                det_centroid = self._calculate_centroid(det["bbox"])
                best_dist = self.max_distance
                best_track_id = None

                for track_id in unmatched_tracks:
                    obj = self.tracked_objects[track_id]
                    if obj.class_name != det["class_name"]:
                        continue
                    obj_centroid = obj.centroids[-1]
                    dist = math.hypot(det_centroid[0] - obj_centroid[0], det_centroid[1] - obj_centroid[1])
                    if dist < best_dist:
                        best_dist = dist
                        best_track_id = track_id

                if best_track_id is not None:
                    matched_tracks.add(best_track_id)
                    unmatched_tracks.remove(best_track_id)
                    self.tracked_objects[best_track_id].update(det["bbox"], timestamp)
                else:
                    # Register new track
                    t_obj = TrackedObject(self.next_track_id, det["class_name"], det["bbox"], timestamp)
                    self.tracked_objects[self.next_track_id] = t_obj
                    self.next_track_id += 1

            # Mark disappeared
            to_remove = []
            for track_id in track_ids:
                if track_id not in matched_tracks:
                    self.tracked_objects[track_id].disappeared_frames += 1
                    if self.tracked_objects[track_id].disappeared_frames > self.max_disappeared:
                        to_remove.append(track_id)
            for track_id in to_remove:
                del self.tracked_objects[track_id]

        # Format output
        results = []
        for track_id, obj in self.tracked_objects.items():
            if obj.disappeared_frames == 0:
                human_id = f"Person #{track_id}" if obj.class_name == "person" else f"Vehicle #{track_id}"
                results.append({
                    "track_id": track_id,
                    "label": human_id,
                    "class_name": obj.class_name,
                    "bbox": obj.bbox,
                    "dwell_time": round(obj.dwell_time, 1),
                    "speed": obj.speed,
                    "direction": obj.direction,
                    "centroid": obj.centroids[-1],
                    "history": obj.centroids[-10:],
                    "in_zones": list(obj.in_zones)
                })
        return results
