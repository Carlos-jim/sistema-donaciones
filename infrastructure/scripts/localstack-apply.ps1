Write-Host "=== Aplicando infraestructura contra LocalStack ===" -ForegroundColor Green

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$liveDir = Join-Path $scriptDir "..\live\local"
Set-Location $liveDir

Write-Host "Inicializando Terragrunt..." -ForegroundColor Yellow
terragrunt run-all init

Write-Host "Generando plan..." -ForegroundColor Yellow
terragrunt run-all plan

$confirm = Read-Host "Deseas aplicar los cambios? (y/N)"
if ($confirm -eq "y" -or $confirm -eq "Y") {
    Write-Host "Aplicando infraestructura..." -ForegroundColor Yellow
    terragrunt run-all apply -auto-approve
    Write-Host "=== Infraestructura aplicada ===" -ForegroundColor Green
} else {
    Write-Host "Aplicacion cancelada." -ForegroundColor Yellow
}
