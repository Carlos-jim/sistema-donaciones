Write-Host "=== Inicializacion de LocalStack para Sistema de Donaciones ===" -ForegroundColor Green

# Verificar que Docker esta corriendo
try {
    $null = docker info 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker no responde"
    }
} catch {
    Write-Host "Error: Docker no esta corriendo. Por favor inicia Docker primero." -ForegroundColor Red
    exit 1
}

$composeMode = $null
try {
    $null = docker compose version 2>$null
    if ($LASTEXITCODE -eq 0) {
        $composeMode = "plugin"
    }
} catch {}

if (-not $composeMode) {
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        $composeMode = "legacy"
    } else {
        Write-Host "Error: No se encontro Docker Compose. Instala 'docker compose' o 'docker-compose'." -ForegroundColor Red
        exit 1
    }
}

function Invoke-Compose {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$ComposeArgs)

    if ($script:composeMode -eq "plugin") {
        & docker compose @ComposeArgs
    } else {
        & docker-compose @ComposeArgs
    }
}

# Iniciar LocalStack y PostgreSQL
Write-Host "Iniciando LocalStack..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$localDir = Join-Path $scriptDir "..\local"
Set-Location $localDir

# Copiar .env si no existe
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Archivo .env creado desde .env.example" -ForegroundColor Yellow
}

Invoke-Compose up -d localstack

# Esperar a que LocalStack este listo
Write-Host "Esperando a que LocalStack este listo..." -ForegroundColor Yellow
$ready = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4566/_localstack/health" -UseBasicParsing -ErrorAction Stop
        if ($response.Content -match '"s3"\s*:\s*"(available|running)"') {
            $ready = $true
            break
        }
    } catch {
        Write-Host "." -NoNewline
    }
    Start-Sleep -Seconds 2
}

if ($ready) {
    Write-Host "LocalStack esta listo!" -ForegroundColor Green
} else {
    Write-Host "LocalStack no respondio a tiempo. Revisa los logs con: docker-compose logs localstack" -ForegroundColor Yellow
}

Write-Host "Iniciando PostgreSQL..." -ForegroundColor Yellow
$postgresAvailable = $true
try {
    Invoke-Compose up -d postgres
} catch {
    $postgresAvailable = $false
    Write-Host "No se pudo iniciar PostgreSQL. Si el puerto 5432 esta ocupado, LocalStack seguira disponible igual." -ForegroundColor Yellow
}

# Verificar PostgreSQL
if ($postgresAvailable) {
    Write-Host "Verificando PostgreSQL..." -ForegroundColor Yellow
    $pgReady = $false
    for ($i = 1; $i -le 30; $i++) {
        $pgResult = Invoke-Compose exec -T postgres pg_isready -U donaciones_admin 2>$null
        if ($pgResult -match "accepting connections") {
            $pgReady = $true
            break
        }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }

    if ($pgReady) {
        Write-Host "PostgreSQL esta listo!" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL no respondio a tiempo." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== LocalStack inicializado correctamente ===" -ForegroundColor Green
Write-Host ""
Write-Host "Servicios disponibles:"
Write-Host "  - LocalStack: http://localhost:4566"
Write-Host "  - PostgreSQL: localhost:5432"
Write-Host "  - Next.js App: http://localhost:3000 (opcional, con 'docker compose --profile app up -d app')"
Write-Host ""
Write-Host "Para aplicar infraestructura con Terragrunt:"
Write-Host "  cd infrastructure/live/local"
Write-Host "  terragrunt run-all apply"
Write-Host ""
Write-Host "Para ver logs:"
Write-Host "  docker compose logs -f localstack"
Write-Host ""
Write-Host "Para detener:"
Write-Host "  docker compose down"
