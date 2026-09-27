@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Node.js 20 veya daha yeni bir surum kurun.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\electron.cmd" (
  echo Ilk kurulum yapiliyor...
  call npm install
  if errorlevel 1 (
    echo Bagimlilik kurulumu basarisiz oldu.
    pause
    exit /b 1
  )
)

echo OpenScriv derleniyor...
call npm run build
if errorlevel 1 (
  echo Derleme basarisiz oldu.
  pause
  exit /b 1
)

echo OpenScriv baslatiliyor...
call npm run electron:start
set exit_code=%errorlevel%
if not "%exit_code%"=="0" (
  echo OpenScriv kapatma kodu: %exit_code%
  pause
)
exit /b %exit_code%

