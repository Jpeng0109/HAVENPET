# Push local HAVENPET changes to GitHub main
$ErrorActionPreference = "Stop"
$git = "C:\Program Files\Git\cmd\git.exe"
$root = Split-Path $PSScriptRoot -Parent

if (-not (Test-Path $git)) {
  Write-Error "Git not found. Install from https://git-scm.com/download/win"
}

Set-Location $root
Write-Host "Repo: $root"
& $git status -sb
Write-Host ""
Write-Host "Fetching origin/main..."
& $git fetch origin main
Write-Host "Merging remote main (allow unrelated histories if needed)..."
& $git pull origin main --allow-unrelated-histories --no-edit
Write-Host "Pushing to GitHub..."
& $git push -u origin main
Write-Host ""
Write-Host "Done. Next: Render Dashboard -> havenpet-api -> Manual Deploy -> Deploy latest commit"
Write-Host "Verify: https://havenpet-api.onrender.com/api/health"
