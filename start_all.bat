@echo off
set "PATH=%~dp0nodejs;%PATH%"
echo =========================================================================
echo [IBVAP] Launching Intelligent Border Video Analytics Platform (SIH 2026)
echo =========================================================================

echo Starting Backend Server on port 8000...
start "IBVAP Backend" cmd /k "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server on port 5173...
start "IBVAP Frontend" cmd /k "cd frontend && ..\nodejs\npm.cmd run dev"

echo =========================================================================
echo IBVAP is initializing!
echo Backend:   http://localhost:8000 (API Docs: http://localhost:8000/docs)
echo Dashboard: http://localhost:5173
echo Operator:  operator / demo123
echo =========================================================================
