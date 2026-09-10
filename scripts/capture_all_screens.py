import os
import subprocess
import time

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = r"C:\IBVAP\screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

TABS = [
    "overview",
    "live",
    "alerts",
    "events",
    "anpr",
    "analytics",
    "cameras",
    "zones",
    "settings"
]

def capture():
    print("Capturing screenshots of all 9 pages for presentation verification...")
    for tab in TABS:
        url = f"http://localhost:5173/#{tab}"
        out_file = os.path.join(OUTPUT_DIR, f"{tab}.png")
        cmd = [
            CHROME_PATH,
            "--headless=new",
            "--disable-gpu",
            "--virtual-time-budget=3000",
            f"--user-data-dir=C:\\IBVAP\\chrome_profile_{tab}",
            f"--screenshot={out_file}",
            "--window-size=1440,900",
            url
        ]
        subprocess.run(cmd, capture_output=True, timeout=15)
        if os.path.exists(out_file):
            size = os.path.getsize(out_file)
            print(f"[OK] {tab}.png generated ({size} bytes)")
        else:
            print(f"[FAIL] {tab}.png not created")

if __name__ == "__main__":
    capture()
