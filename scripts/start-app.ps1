$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Logs = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $Logs | Out-Null

function Test-Command($command) {
    return [bool](Get-Command $command -ErrorAction SilentlyContinue)
}

Write-Host "Starting Smart Budget Tracker & Asset Allocator..." -ForegroundColor Cyan

if (-not (Test-Command "python")) {
    Write-Host "Python was not found. Install Python 3.11+ and try again." -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "Node.js/npm was not found. Install Node.js LTS and try again." -ForegroundColor Red
    pause
    exit 1
}

$VenvPython = Join-Path $Backend "venv\Scripts\python.exe"
$BackendDepsStamp = Join-Path $Backend "venv\.deps-installed"
if (-not (Test-Path $VenvPython)) {
    Write-Host "Creating backend virtual environment..." -ForegroundColor Yellow
    Push-Location $Backend
    python -m venv venv
    Pop-Location
}

if (-not (Test-Path $BackendDepsStamp)) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location $Backend
    & $VenvPython -m pip install -r requirements.txt | Tee-Object -FilePath (Join-Path $Logs "backend-install.log")
    New-Item -ItemType File -Force -Path $BackendDepsStamp | Out-Null
    Pop-Location
}

if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $Frontend
    npm install | Tee-Object -FilePath (Join-Path $Logs "frontend-install.log")
    Pop-Location
}

$BackendCommand = "cd /d `"$Backend`" && venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
$FrontendCommand = "cd /d `"$Frontend`" && npm run dev -- --host 0.0.0.0"

Write-Host "Launching backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k", $BackendCommand -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host "Launching frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k", $FrontendCommand -WindowStyle Normal
Start-Sleep -Seconds 3

$LocalIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object -First 1 -ExpandProperty IPAddress)

Write-Host ""
Write-Host "App is starting." -ForegroundColor Cyan
Write-Host "Laptop URL: http://localhost:5173" -ForegroundColor White
if ($LocalIp) {
    Write-Host "Mobile URL on same Wi-Fi: http://$LocalIp`:5173" -ForegroundColor White
}
Write-Host "Backend API: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Use stop-app.bat to stop servers later." -ForegroundColor Yellow
Start-Process "http://localhost:5173"
pause
