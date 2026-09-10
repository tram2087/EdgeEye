import os
import cv2
import numpy as np
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("EdgeEye.AI.Detector")

# Target class IDs in COCO:
# 0: person, 1: bicycle, 2: car, 3: motorcycle, 5: bus, 7: truck
TARGET_CLASSES = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}

class ObjectDetector:
    _instance = None  # Singleton instance

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ObjectDetector, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_path: str = "yolov8n.pt", conf_threshold: float = 0.40):
        if getattr(self, "_initialized", False):
            return
        self.conf_threshold = conf_threshold
        self.model = None
        self.is_real_model = False
        self.model_path = model_path
        self.inference_width = 480  # Downscale frame width for CPU inference
        self._init_model()
        self._initialized = True

    def _init_model(self):
        try:
            # Constrain PyTorch thread count to prevent CPU core exhaustion
            try:
                import torch
                torch.set_num_threads(min(2, os.cpu_count() or 2))
            except Exception:
                pass

            from ultralytics import YOLO
            logger.info(f"Loading singleton YOLO model from {self.model_path} on CPU...")
            self.model = YOLO(self.model_path)
            self.is_real_model = True
            logger.info("Ultralytics YOLO (CPU Optimized, imgsz=384) initialized successfully.")
        except Exception as e:
            logger.warning(f"Failed to load Ultralytics YOLO: {e}. Switching to graceful fallback detector.")
            self.model = None
            self.is_real_model = False

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Runs object detection on a frame with CPU downscaling.
        Returns list of detections scaled back to original frame coordinates.
        """
        detections = []
        if frame is None or frame.size == 0:
            return detections

        orig_h, orig_w = frame.shape[:2]

        if self.is_real_model and self.model is not None:
            try:
                # Downscale for CPU inference speed (640x360 or 480x270)
                if orig_w > self.inference_width:
                    scale = self.inference_width / float(orig_w)
                    inf_h = int(orig_h * scale)
                    resized = cv2.resize(frame, (self.inference_width, inf_h), interpolation=cv2.INTER_LINEAR)
                    scale_x = orig_w / float(self.inference_width)
                    scale_y = orig_h / float(inf_h)
                else:
                    resized = frame
                    scale_x = 1.0
                    scale_y = 1.0

                # Lightweight inference with imgsz=384 and CPU device
                results = self.model(resized, conf=self.conf_threshold, imgsz=384, device='cpu', verbose=False)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0].item())
                        if cls_id in TARGET_CLASSES:
                            conf = float(box.conf[0].item())
                            xyxy = box.xyxy[0].tolist()
                            # Scale coordinates back to original frame
                            x1 = max(0.0, float(xyxy[0]) * scale_x)
                            y1 = max(0.0, float(xyxy[1]) * scale_y)
                            x2 = min(float(orig_w), float(xyxy[2]) * scale_x)
                            y2 = min(float(orig_h), float(xyxy[3]) * scale_y)
                            detections.append({
                                "bbox": [x1, y1, x2, y2],
                                "class_id": cls_id,
                                "class_name": TARGET_CLASSES[cls_id],
                                "confidence": round(conf, 3)
                            })
                return detections
            except Exception as e:
                logger.error(f"Inference error with real model: {e}. Using fallback detection.")

        return detections
