@echo off
setlocal

cd /d "%~dp0"

if not exist ".env" (
  echo [INFO] No existe .env. Se crea automaticamente desde .env.example
  copy /Y ".env.example" ".env" >nul
  echo [INFO] Revisa backend\.env si tu usuario o contrasena de MySQL son diferentes.
)

if not exist "node_modules" (
  echo [INFO] Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Fallo la instalacion de dependencias.
    exit /b 1
  )
)

echo [INFO] Iniciando backend en http://localhost:3000
call npm start
