# Trigger Render redeploy via Deploy Hook (create in Render Dashboard -> havenpet-api -> Settings -> Deploy Hook)
param(
  [Parameter(Mandatory = $true)]
  [string]$DeployHookUrl
)

Write-Host "Triggering Render deploy..."
try {
  $r = Invoke-WebRequest -Uri $DeployHookUrl -Method POST -UseBasicParsing -TimeoutSec 60
  Write-Host "Status: $($r.StatusCode)"
  Write-Host $r.Content
  Write-Host ""
  Write-Host "Wait 5-10 min, then check: https://havenpet-api.onrender.com/api/health"
} catch {
  Write-Error $_
  exit 1
}
