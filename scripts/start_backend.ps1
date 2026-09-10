Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[IBVAP] Starting FastAPI Video Analytics Backend..." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\.."
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
