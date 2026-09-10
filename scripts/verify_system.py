import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:5173"

def test_endpoint(name, url, method="GET", data=None):
    try:
        req = urllib.request.Request(url, method=method)
        if data:
            req.add_header('Content-Type', 'application/json')
            req.data = json.dumps(data).encode('utf-8')
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            content_type = response.headers.get('Content-Type', '')
            if 'image' in content_type:
                raw = response.read()
                print(f"[PASS] {name} ({method} {url}) -> HTTP {status} (Binary Image: {len(raw)} bytes)")
                return True, "binary image"
            else:
                body = response.read().decode('utf-8')
                print(f"[PASS] {name} ({method} {url}) -> HTTP {status}")
                return True, body
    except Exception as e:
        print(f"[FAIL] {name} ({method} {url}) -> {e}")
        return False, str(e)

def run_all_checks():
    print("===================================================")
    print("  IBVAP SYSTEM-WIDE HEALTH & INTEGRATION CHECK  ")
    print("===================================================")

    results = []

    # 1. Health
    results.append(test_endpoint("Health Check", f"{BASE_URL}/api/health")[0])
    
    # 2. System status
    results.append(test_endpoint("System Status", f"{BASE_URL}/api/system/status")[0])
    
    # 3. Auth login
    results.append(test_endpoint("Auth Login", f"{BASE_URL}/api/auth/login", method="POST", data={"username": "operator", "password": "demo123"})[0])
    
    # 4. Cameras
    results.append(test_endpoint("Camera List", f"{BASE_URL}/api/cameras")[0])
    
    # 5. Alerts
    results.append(test_endpoint("Alerts List", f"{BASE_URL}/api/alerts")[0])
    
    # 6. Events
    results.append(test_endpoint("Events List", f"{BASE_URL}/api/events")[0])
    
    # 7. Zones
    results.append(test_endpoint("Zones List", f"{BASE_URL}/api/zones")[0])
    
    # 8. ANPR
    results.append(test_endpoint("ANPR Plates", f"{BASE_URL}/api/anpr")[0])
    
    # 9. Watchlist
    results.append(test_endpoint("Watchlist", f"{BASE_URL}/api/watchlist")[0])
    
    # 10. Analytics
    results.append(test_endpoint("Analytics Summary", f"{BASE_URL}/api/analytics/summary")[0])
    
    # 11. Camera snapshot
    results.append(test_endpoint("Camera Snapshot", f"{BASE_URL}/api/cameras/BOP-01/snapshot")[0])

    # 12. Frontend
    results.append(test_endpoint("Frontend Server", FRONTEND_URL)[0])

    print("===================================================")
    passed = sum(results)
    total = len(results)
    print(f"Summary: {passed}/{total} checks passed.")
    if passed == total:
        print("SYSTEM VERIFICATION COMPLETE: ALL SERVICES OPERATIONAL!")
        sys.exit(0)
    else:
        print("SOME CHECKS FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    run_all_checks()
