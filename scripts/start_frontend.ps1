Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[IBVAP] Starting React Vite Command Center..." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\frontend"
& "$PSScriptRoot\..\nodejs\npm.cmd" run dev
