# IBVAP System Architecture Document

**Platform:** IBVAP — Intelligent Border Video Analytics Platform  
**Target Event:** Smart India Hackathon (SIH 2026)  
**Theme:** Software-Defined AI-powered Border Security and Smart CCTV Surveillance

---

## 1. Executive Summary

Standard border security and checkpoint cameras are typically passive video recorders requiring manual operator vigilance. Replacing physical cameras with dedicated proprietary "smart AI cameras" incurs enormous infrastructure replacement costs and vendor lock-in.

**IBVAP** solves this challenge by serving as a **hardware-agnostic software layer** that connects to existing analogue CCTV cameras, IP cameras (via RTSP/ONVIF), local digital video feeds, webcams, or synthetic simulated streams. It executes real-time AI object detection, persistent multi-object tracking, virtual fence intrusion enforcement, optical number plate recognition (ANPR), and low-light movement detection on edge compute nodes.

---

## 2. End-to-End Pipeline Architecture

```
+-------------------------------------------------------------------------+
|                        1. VIDEO INGESTION LAYER                         |
|  - RTSP Streams (rtsp://...)  - Analogue/IP NVR feeds                   |
|  - Local Border Patrol Video Files (.mp4, .avi)                         |
|  - USB / Integrated Tactical Webcams                                    |
|  - Autonomous High-Fidelity Synthetic Border Patrol Generator           |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                        2. COMPUTER VISION & AI ENGINE                   |
|  ┌───────────────────────────────────────────────────────────────────┐  |
|  │  Ultralytics YOLOv8n Object Detector                              │  |
|  │  - Targets: Person, Car, Motorcycle, Bus, Truck                   │  |
|  │  - Resilient CPU/GPU inference fallback                          │  |
|  └───────────────────────────────────────────────────────────────────┘  |
|                                   │                                     |
|  ┌────────────────────────────────▼──────────────────────────────────┐  |
|  │  ByteTrack Multi-Object Centroid & IoU Tracker                    │  |
|  │  - Persistent Track Identifiers (Person #1, Vehicle #4)           │  |
|  │  - Dwell time computation & velocity vector direction             │  |
|  └───────────────────────────────────────────────────────────────────┘  |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                        3. EXPLAINABLE RULE ANALYTIC ENGINES             |
|  ┌────────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ |
|  │ Virtual Fence / PiP    │  │ Night Movement Engine │  │ ANPR Engine │ |
|  │ Ray-Casting Polygon    │  │ Frame Luminance &     │  │ Plate Crop, │ |
|  │ Intrusion Detection    │  │ Operational Windows   │  │ OCR, Watch- │ |
|  │ (Restricted/Perimeter) │  │ Low-light Motion      │  │ list Match  │ |
|  └────────────────────────┘  └───────────────────────┘  └─────────────┘ |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                        4. EVENT & EVIDENCE CAPTURE                      |
|  - Automated Cryptographic Evidence Snapshots (evidence/*.jpg)          |
|  - Telemetry generation: Camera, BBox, Threat Level, Dwell Duration     |
|  - Threat Severity Classification: INFO, WARNING, HIGH, CRITICAL        |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                        5. PERSISTENCE & API LAYER                       |
|  - SQLite (ibvap.db) with SQLAlchemy Relational Models                  |
|  - FastAPI REST Endpoints (/api/cameras, /api/events, /api/alerts)      |
|  - WebSocket Push Broadcast Channel (/ws/alerts)                        |
|  - Resilient Polling Fallback Guarantee                                 |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                        6. FRONTEND COMMAND CENTER (SOC UI)              |
|  - Dark Military Security Operations Center (SOC) Aesthetic             |
|  - React + Vite + TypeScript + Tailwind CSS + Lucide Icons + Recharts   |
|  - 9 Tactical Pages: Overview, Live, Alerts, Events, ANPR,              |
|    Analytics, Cameras, Zones, Settings                                  |
+-------------------------------------------------------------------------+
```

---

## 3. Detailed Component Breakdown

### 3.1 Object Detection (`ai/detector.py`)
- Utilizes pretrained **Ultralytics YOLOv8n** weights.
- Targets border security classes: `person` (0), `bicycle` (1), `car` (2), `motorcycle` (3), `bus` (5), `truck` (7).
- Contains an automatic fallback heuristic detector that ensures the platform never crashes even in air-gapped environments without model weights or GPU drivers.

### 3.2 Multi-Object Tracking (`ai/tracker.py`)
- Employs IoU overlap and Hungarian centroid matching to assign persistent tracking IDs: `Person #1`, `Person #2`, `Vehicle #1`.
- Retains 30-frame movement history to derive direction (NORTH, SOUTH, EAST, WEST), velocity, and stationary dwell duration.

### 3.3 Virtual Fence Intrusion (`ai/intrusion.py`)
- Evaluates object ground footprints (bottom-center of bounding box) against customizable polygon vertices using ray-casting point-in-polygon math.
- Detects boundary crossing immediately (< 50ms) and flags `INTRUSION`.
- Tracks dwell duration inside zones to detect `LOITERING` exceeding configurable thresholds.

### 3.4 ANPR Pipeline (`ai/anpr.py`)
- Locates lower vehicle bumper regions and extracts candidate license plate bounding boxes.
- Applies grayscale conversion, bilateral edge-preserving smoothing, and Otsu adaptive thresholding.
- Passes cropped plate to OCR pipeline and cross-references against border watchlist targets (`DEMO-001`, `DEMO-4821`, `PB-10-AZ-9988`).

### 3.5 Night & Low-Light Movement (`ai/night_detection.py`)
- Measures perceived frame luminance (0-255 scale).
- Triggers `NIGHT_MOVEMENT` whenever moving entities appear during configured night hours or when ambient illumination drops below the configurable cutoff.

---

## 4. Hardware Agnosticism & Deployment

IBVAP is designed for deployment on edge gateway servers (e.g., standard x86/ARM industrial PCs, Intel Core i5/i7 laptops, or Jetson nodes). By executing all heavy vision processing on the edge backend, client command stations only need a standard modern web browser to monitor multiple border outposts simultaneously.
