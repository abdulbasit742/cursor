$ErrorActionPreference = "Stop"

Write-Host "AI Code Editor readiness check" -ForegroundColor Cyan

$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue

if (-not $node) {
  Write-Host "Missing node. Install Node.js LTS from https://nodejs.org" -ForegroundColor Red
  exit 1
}

if (-not $npm) {
  Write-Host "Missing npm. Install Node.js LTS from https://nodejs.org, then reopen PowerShell." -ForegroundColor Red
  exit 1
}

Write-Host "Node: $(& node --version)" -ForegroundColor Green
Write-Host "npm:  $(& npm --version)" -ForegroundColor Green

if (-not (Test-Path -LiteralPath "node_modules")) {
  Write-Host "node_modules missing. Run: npm install" -ForegroundColor Yellow
} else {
  Write-Host "Dependencies folder exists." -ForegroundColor Green
}

Write-Host "Recommended checks:" -ForegroundColor Cyan
Write-Host "npm run typecheck"
Write-Host "npm run build"
Write-Host "npm run dev"
