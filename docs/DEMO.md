# IBVAP Demonstration Guide for SIH 2026

**Project:** IBVAP — Intelligent Border Video Analytics Platform  
**Target Audience:** SIH Evaluation Panel / Jury  
**Duration:** 3 to 5 Minutes Demonstration Flow

---

## Key Talking Points for Judges

1. **Hardware-Agnostic Paradigm:**
   Explain that IBVAP transforms **existing standard CCTV and IP cameras** into intelligent surveillance outposts through edge software, eliminating the multi-crore expense of replacing thousands of border cameras with proprietary AI hardware.

2. **Full-Spectrum Edge Video Analytics:**
   Highlights:
   - Real-time Human & Vehicle Detection (Ultralytics YOLOv8n)
   - Multi-Object Tracking with persistent IDs (`Person #1`, `Vehicle #2`) & movement vectors
   - Virtual Fence / Restricted Zone Intrusion (Point-in-Polygon ray casting)
   - Automatic Number Plate Recognition (ANPR) with Border Watchlist cross-referencing
   - Low-Light & Night Movement Detection via perceived luminance and time schedules
   - Cryptographically stamped Evidence Snapshot logging (`evidence/*.jpg`)

3. **Zero-Crash Resiliency & Fail-Safe Architecture:**
   Even on an offline laptop without active physical border cameras or GPUs, the platform provides an autonomous **High-Fidelity Synthetic Border Simulation** that actively demonstrates person patrols, moving patrol vehicles, virtual fence breaches, and ANPR scans in real time!

---

## 3–5 Minute Step-by-Step Live Demo Script

### Step 1: Login & Command Overview (0:00 - 0:45)
- Open browser at `http://localhost:5173`.
- Point out the dark **Security Operations Center (SOC) aesthetic**, military HUD telemetry, and top status bar showing `SOC OPERATIONAL` and `EDGE AI PIPELINE ACTIVE`.
- Log in with operator credentials:
  - **Username:** `operator`
  - **Password:** `demo123`
- Highlight the **6 Real-time KPI Cards**:
  - Total Cameras (4 active outposts)
  - Active Cameras (100% operational)
  - Persons Detected (142 tracked)
  - Vehicles Detected (67 tracked)
  - Active Alerts & Critical Alerts
- Scroll to the **12-Hour Movement Saturation Chart** and the **Live Camera Matrix Preview**.

### Step 2: Live Tactical Surveillance & Virtual Fence (0:45 - 2:00)
- Navigate to **Live Surveillance** tab.
- Select camera **`BOP-01 (Sector Alpha — Forward Perimeter)`**.
- Show judges the active live feed:
  - **Bounding Boxes:** Color-coded bounding boxes on moving personnel and vehicles.
  - **Persistent Tracking Labels:** `Person #1 | 4.2 px/s`, `Vehicle #1`.
  - **Virtual Fence Buffer:** Point out the shaded amber/red polygon overlay on the border terrain.
- Demonstrate that when a tracked person crosses into the **Red Line Restricted Zone**, the system instantaneously generates a **CRITICAL PERIMETER INTRUSION ALERT**!
- Switch layout to **2x2 Wall** to show simultaneous multi-outpost surveillance (`BOP-01`, `BOP-02`, `BOP-03`, `CHECKPOST-01`).
- Click **Capture Snapshot** to demonstrate manual evidence archiving.

### Step 3: Alerts Management & Evidence Inspection (2:00 - 2:50)
- Navigate to **Alerts** tab.
- Point out the priority triage table with severity badges (`CRITICAL`, `HIGH`, `WARNING`, `INFO`).
- Click **"Evidence"** button on the latest Intrusion Alert.
- An **Evidence Snapshot Modal** opens displaying:
  - High-resolution frame captured at the exact second of breach.
  - Sector location, timestamp, target object ID (`Person #17`), and 94% AI confidence score.
  - Cryptographic verification note and instant JPEG download button.
- Click **"Acknowledge"** or **"Resolve"** to demonstrate full operator workflow compliance.

### Step 4: ANPR & Watchlist Detection (2:50 - 3:40)
- Navigate to **ANPR** tab.
- Explain the pipeline: Vehicle Detection → Lower Plate Crop → Adaptive Thresholding → OCR Text Extraction → Watchlist Verification.
- In the **Interactive ANPR Pipeline Test**, input target plate `DEMO-4821` and click **"Trigger ANPR Scan"**.
- Watch the system immediately classify the scan as **`WATCHLIST (CRITICAL)`** and flag it across the entire surveillance network!
- Show the **Border Security Watchlist** manager where operators can add new target plates (e.g. `DEMO-9900`) and intelligence rationales in one click.

### Step 5: Event Explorer, Analytics & Settings (3:40 - 4:30)
- Navigate to **Event Explorer**: Show comprehensive historical event logs with filters for camera, severity, and event type.
- Navigate to **Analytics**: Highlight the **Incident Frequency by Event Type** bar chart, **Severity Distribution** donut chart, and **Camera Uptime Matrix**.
- Navigate to **Settings**: Show that all parameters (detection confidence, night start/end hours, loitering dwell threshold) are **dynamically connected** to the backend rule engine and update live without restarting!

---

## Quick Reference URLs & Credentials
- **Web Dashboard:** `http://localhost:5173`
- **FastAPI Swagger API Docs:** `http://localhost:8000/docs`
- **Demo Operator:** `operator` / `demo123`
- **Demo Administrator:** `admin` / `admin123`
