# Run Next.js dev server (works even if npm is not on PATH yet)
$nodeDir = "C:\Program Files\nodejs"
if (-not (Test-Path "$nodeDir\npm.cmd")) {
    Write-Host "Node.js not found. Install from https://nodejs.org/ or run: winget install OpenJS.NodeJS.LTS" -ForegroundColor Red
    exit 1
}

$env:Path = "$nodeDir;" + [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    & "$nodeDir\npm.cmd" install
}

Write-Host "Starting dev server at http://localhost:3000" -ForegroundColor Green
& "$nodeDir\npm.cmd" run dev
