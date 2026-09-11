# EdgeEye — Intelligent Border Video Analytics Platform

[![Frontend Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel%20Live-black.svg?logo=vercel)](https://frontend-vert-nu-79.vercel.app)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/tram2087/EdgeEye)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB.svg)](https://react.dev)
[![Ultralytics YOLO](https://img.shields.io/badge/AI-YOLOv8%20%2B%20ByteTrack-FF6F00.svg)](https://ultralytics.com)

**EdgeEye** is an AI-powered, software-defined CCTV video analytics platform designed for smart border surveillance and perimeter security. It transforms ordinary CCTV and IP cameras into intelligent sentry nodes without requiring expensive proprietary smart-camera hardware.

---

## Live Deployments & Repository
- **Frontend (Vercel)**: [https://frontend-vert-nu-79.vercel.app](https://frontend-vert-nu-79.vercel.app)
- **GitHub Repository**: [https://github.com/tram2087/EdgeEye](https://github.com/tram2087/EdgeEye)
- **1-Click Render Deploy**: [Deploy Backend to Render](https://render.com/deploy?repo=https://github.com/tram2087/EdgeEye)

---

## 1. Problem Statement & Core Value Proposition

Traditional border outposts and transit checkpoints operate thousands of standard CCTV, PTZ, and IP cameras. However, standard cameras are passive video streams:
- Human operators suffer attention fatigue after 20 minutes of continuous monitor watch.
- Replacing extensive camera networks with proprietary "AI cameras" costs tens of crores in capital expenditure.
- Vendor lock-in prevents interoperability across diverse camera brands.

**EdgeEye delivers a software-defined solution:**
- **Hardware-Agnostic:** Ingests video from legacy analogue CCTV, digital NVRs, IP cameras (RTSP/ONVIF), local video files, USB webcams, and synthetic simulation feeds.
- **Edge-Ready Analytics:** Runs real-time AI object detection, persistent multi-object tracking, and virtual fence enforcement directly on commodity edge gateways.
- **Centralized Command Matrix:** Delivers a unified military Security Operations Center (SOC) dashboard with instantaneous alert triage, cryptographic evidence capture, and real-time ANPR watchlist verification.

---

## 2. Key Capabilities & Features

| Capability | Technical Implementation | Operational Purpose |
| :--- | :--- | :--- |
| **Human & Vehicle Detection** | Ultralytics YOLOv8n (Lightweight pretrained model) | Identifies personnel, cars, trucks, buses, motorcycles |
| **Persistent Multi-Object Tracking** | Centroid & IoU Overlap Tracker (ByteTrack style) | Assigns persistent labels (`Person #1`, `Vehicle #4`), computes dwell times & vectors |
| **Virtual Fence / Intrusion** | Ray-Casting Point-in-Polygon (PiP) Algorithm | Triggers instantaneous **CRITICAL** perimeter breach alerts upon line crossing |
| **Loitering Detection** | Temporal Dwell Counter | Detects stationary targets exceeding configurable dwell thresholds (e.g. > 10s) |
| **Automated Number Plate Recognition (ANPR)** | Adaptive Thresholding + OCR Pipeline | Extracts license plate numbers and checks against the border security watchlist |
| **Border Watchlist Intelligence** | SQLite Relational Database Engine | Flags high-risk vehicles (`DEMO-001`, `DEMO-4821`) and alerts operators |
| **Low-Light / Night Movement** | Perceived Frame Luminance + Scheduling Engine | Flags unauthorized activity during night windows or dark ambient conditions |
| **Cryptographic Evidence Capture** | High-Res Frame Snapshot Archival (`evidence/*.jpg`) | Automatically captures forensic snapshots with timestamp and sector metadata |
| **Real-Time Alert Dispatch** | WebSockets (`/ws/alerts`) with Polling Fallback | Instant dashboard updates with zero browser page refreshes |
| **SOC Command Dashboard** | React + Vite + Tailwind CSS + Recharts | Dark SOC aesthetic, 9 functional pages, telemetry HUD, audio alerts |

---

## 3. Technology Stack

- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS, Lucide React icons, Recharts
- **Backend:** Python 3.14 / 3.11+, FastAPI, Uvicorn, WebSockets, Pydantic v2
- **AI & Computer Vision:** OpenCV (cv2), Ultralytics YOLOv8n, ByteTrack Centroid Tracking, OCR pipeline
- **Database:** SQLite 3 with SQLAlchemy 2.0 ORM
- **Package Management:** Standard npm and pip workflows

---

## 4. Quick Start Guide

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js LTS (standalone portable Node.js LTS included in `nodejs/` or system Node)

### 1-Click Launch (Recommended)
Simply double-click:
```bash
start_all.bat
```
or run from PowerShell:
```powershell
.\scripts\start_all.ps1
```

### Manual Service Startup

#### Backend Server
```bash
# Navigate to project root
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Server: `http://localhost:8000`
- Interactive Swagger API Docs: `http://localhost:8000/docs`

#### Frontend Command Center
```bash
cd frontend
..\nodejs\npm.cmd run dev
```
- Dashboard URL: `http://localhost:5173`

---

## 5. Demo Operator Credentials

For SIH evaluation and testing, use the preconfigured demo accounts:

- **Security Operator:**
  - **Username:** `operator`
  - **Password:** `demo123`
  - **Permissions:** Triage alerts, acknowledge incidents, test ANPR, monitor live feeds.

- **System Administrator:**
  - **Username:** `admin`
  - **Password:** `admin123`
  - **Permissions:** Full fleet configuration, rule calibration, watchlist management.

*(Note: These are demo credentials intended for evaluation. Production deployments utilize hashed argon2/bcrypt credentials and JWT rotation).*

---

## 6. Preconfigured Border Outposts & Demo Mode

IBVAP is pre-seeded with 4 tactical border outposts:
1. **`BOP-01`**: Sector Alpha — Forward Perimeter (Virtual Red Line Buffer)
2. **`BOP-02`**: Sector Bravo — Riverine Bed (River Crossing Watch)
3. **`BOP-03`**: Sector Charlie — High Ridge Observation Post
4. **`CHECKPOST-01`**: Main Transit Checkpost & Gate (ANPR Target Zone)

### Autonomous Synthetic Border Simulation
If physical CCTV cameras, RTSP streams, or GPUs are not attached to the host machine, IBVAP **automatically generates dynamic border video streams** with terrain, border fences, patrol personnel, vehicles, and real-time bounding box tracking. The platform **never crashes or displays broken blank screens**.

---

## 7. REST API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health and heartbeat |
| `GET` | `/api/system/status` | Edge CPU, memory, storage, and AI engine status |
| `GET` | `/api/cameras` | List all registered camera nodes with live counts |
| `POST` | `/api/cameras` | Register a new camera node (DEMO, LOCAL, WEBCAM, RTSP) |
| `GET` | `/api/cameras/{id}/stream` | Real-time MJPEG live stream with AI annotations |
| `GET` | `/api/alerts` | Query active and historical security alerts |
| `PATCH`| `/api/alerts/{id}` | Acknowledge or resolve an alert |
| `GET` | `/api/events` | Historical surveillance event explorer with filters |
| `GET` | `/api/zones` | Virtual fence configurations |
| `POST`| `/api/zones` | Create a new polygon / rectangular virtual fence |
| `GET` | `/api/anpr` | Scanned license plates log |
| `POST`| `/api/anpr/process` | Interactive ANPR testing upload endpoint |
| `GET` | `/api/watchlist` | Border intelligence watchlist plates |
| `GET` | `/api/analytics/summary` | Aggregated KPI metrics, 12-hour timeline, severity distributions |
| `WS`  | `/ws/alerts` | Real-time WebSocket alert channel |

---

## 8. Project Limitations & Ethical Guardrails

- **Prototype Status:** IBVAP is an emergency demonstration MVP created for SIH 2026.
- **No Unsupported Claims:** IBVAP does **NOT** claim to predict crime, assess criminal intent, or guarantee military-grade facial recognition accuracy.
- **Explainable Behavioral Analytics:** All alerts are generated via mathematically transparent rule engines (e.g. entering a user-defined polygon, exceeding dwell duration, or matching a designated alphanumeric watchlist record).
- **Synthetic Data Usage:** All names, vehicle numbers (`DEMO-001`, `DEMO-4821`), and locations (`Sector Alpha`) are completely fictional.

---

## 9. Future Scope

1. **Hardware Acceleration:** Native TensorRT / OpenVINO quantization for 60+ FPS on edge accelerators (NVIDIA Jetson, Intel NCS).
2. **Thermal & Infrared Fusion:** Dual-stream RGB + FLIR thermal camera analytics for complete zero-visibility border night operations.
3. **PTZ Slew-to-Cue:** Automated pan-tilt-zoom camera tracking that locks onto intruders triggered by fixed radar or perimeter sensors.
4. **Mesh Relay Networking:** Ad-hoc encrypted LoRa/Wi-Fi mesh networking between remote outposts where internet backhaul is disrupted.
