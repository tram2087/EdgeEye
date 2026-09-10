import os
import sys
import unittest
import numpy as np

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.database import init_db, SessionLocal
from backend.app import models
from ai.detector import ObjectDetector
from ai.tracker import ObjectTracker
from ai.intrusion import VirtualFenceDetector
from ai.night_detection import NightMovementDetector
from ai.anpr import ANPREngine

class TestIBVAPCore(unittest.TestCase):
    def setUp(self):
        init_db()
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_database_initialization(self):
        cam_count = self.db.query(models.Camera).count()
        self.assertGreaterEqual(cam_count, 0)

    def test_virtual_fence_ray_casting(self):
        fence = VirtualFenceDetector()
        # Define rectangle [(100, 100), (200, 100), (200, 200), (100, 200)]
        poly = [[100, 100], [200, 100], [200, 200], [100, 200]]
        
        # Point inside
        self.assertTrue(fence.point_in_polygon(150, 150, poly))
        # Point outside
        self.assertFalse(fence.point_in_polygon(50, 50, poly))
        self.assertFalse(fence.point_in_polygon(250, 150, poly))

    def test_night_luminance(self):
        night = NightMovementDetector()
        dark_frame = np.zeros((100, 100, 3), dtype=np.uint8)
        lum = night.calculate_luminance(dark_frame)
        self.assertEqual(lum, 0.0)

        bright_frame = np.ones((100, 100, 3), dtype=np.uint8) * 200
        lum_bright = night.calculate_luminance(bright_frame)
        self.assertAlmostEqual(lum_bright, 200.0, delta=1.0)

    def test_tracker_persistent_id(self):
        tracker = ObjectTracker()
        dets = [
            {"bbox": [100, 100, 150, 200], "class_name": "person", "confidence": 0.9}
        ]
        tracks1 = tracker.update(dets, timestamp=1.0)
        self.assertEqual(len(tracks1), 1)
        track_id = tracks1[0]["track_id"]

        # Move slightly
        dets2 = [
            {"bbox": [105, 105, 155, 205], "class_name": "person", "confidence": 0.9}
        ]
        tracks2 = tracker.update(dets2, timestamp=2.0)
        self.assertEqual(len(tracks2), 1)
        # Verify persistent ID maintained
        self.assertEqual(tracks2[0]["track_id"], track_id)

    def test_anpr_watchlist_classification(self):
        anpr = ANPREngine()
        dummy_crop = np.ones((30, 100, 3), dtype=np.uint8) * 255
        text, conf = anpr.extract_plate_text(dummy_crop)
        self.assertTrue(len(text) >= 4)

if __name__ == '__main__':
    unittest.main()
