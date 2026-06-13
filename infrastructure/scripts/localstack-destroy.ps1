Write-Host "=== Destruyendo infraestructura local ===" -ForegroundColor Green

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$liveDir = Join-Path $scriptDir "..\live\local"
Set-Location $liveDir

Write-Host "Destruyendo recursos de Terragrunt..." -ForegroundColor Yellow
terragrunt run-all destroy -auto-approve

Write-Host ""
Write-Host "Deteniendo contenedores Docker..." -ForegroundColor Yellow
$localDir = Join-Path $scriptDir "..\local"
Set-Location $localDir
docker-compose down -v

Write-Host "=== Limpieza completada ===" -ForegroundColor Green
