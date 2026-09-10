@echo off
echo ===================================================
echo [IBVAP] Starting React Vite Command Center...
echo ===================================================
cd /d "%~dp0\..\frontend"
..\nodejs\npm.cmd run dev
pause
