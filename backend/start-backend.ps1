$ErrorActionPreference = 'Stop'

Set-Location -Path $PSScriptRoot

if (-not (Test-Path '.env')) {
    Write-Host '[INFO] No existe .env. Se crea automaticamente desde .env.example'
    Copy-Item '.env.example' '.env' -Force
    Write-Host '[INFO] Revisa backend/.env si tu usuario o contrasena de MySQL son diferentes.'
}

if (-not (Test-Path 'node_modules')) {
    Write-Host '[INFO] Instalando dependencias...'
    npm install
}

Write-Host '[INFO] Iniciando backend en http://localhost:3000'
npm start
