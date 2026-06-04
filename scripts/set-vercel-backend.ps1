# Usage: .\scripts\set-vercel-backend.ps1 -BackendUrl "https://havenpet-api.onrender.com"
param(
  [Parameter(Mandatory = $true)]
  [string]$BackendUrl
)

$BackendUrl = $BackendUrl.Trim().TrimEnd('/')
$npm = "C:\Program Files\nodejs\npx.cmd"
$frontend = Join-Path $PSScriptRoot "..\frontend"

if (-not (Test-Path $npm)) {
  Write-Error "Node.js npx not found. Install Node.js first."
  exit 1
}

Write-Host "Setting Vercel BACKEND_URL=$BackendUrl (Production)..."
& $npm vercel env rm BACKEND_URL production -y --cwd $frontend 2>$null
$BackendUrl | & $npm vercel env add BACKEND_URL production --cwd $frontend

$DirectApiUrl = "$BackendUrl/api"
Write-Host "Setting Vercel NEXT_PUBLIC_API_URL=$DirectApiUrl (Production, bypasses 10s proxy timeout)..."
& $npm vercel env rm NEXT_PUBLIC_API_URL production -y --cwd $frontend 2>$null
$DirectApiUrl | & $npm vercel env add NEXT_PUBLIC_API_URL production --cwd $frontend

if (-not $?) {
  Write-Error "Failed to set Vercel environment variables."
  exit 1
}

Write-Host "Redeploying frontend to production..."
& $npm vercel --prod --yes --cwd $frontend

Write-Host "Done. Test: $BackendUrl/api/health"
Write-Host "Login: https://frontend-alpha-gilt-93.vercel.app/login"
