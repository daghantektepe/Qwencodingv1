@echo off
setlocal
title OpenScriv Desktop Launcher
cd /d "%~dp0"

echo ======================================================================
echo             OpenScriv v2.1 - Masaustu Yazi Studyosu
echo ======================================================================
echo.

REM 1. Node.js ve npm kontrolu
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 goto :no_node

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 goto :no_npm

REM 2. Bagimlilik kontrolu
if not exist "node_modules\.bin\electron.cmd" goto :install_deps
goto :check_build

:install_deps
echo [BILGI] Ilk kurulum: Bagimliliklar yukleniyor...
call npm install
if %ERRORLEVEL% NEQ 0 goto :deps_failed

:check_build
REM 3. Uretim derlemesi kontrolu
if not exist "dist\index.html" goto :build_app
goto :launch_app

:build_app
echo [BILGI] Ilk uretim derlemesi hazirlaniyor (tsc ve vite)...
call npm run build
if %ERRORLEVEL% NEQ 0 goto :build_failed

:launch_app
REM 4. Uygulamayi baslat
echo [BILGI] OpenScriv masaustu uygulamasi baslatiliyor...
call npm run electron:start -- %*
exit /b %ERRORLEVEL%

:no_node
echo [HATA] Node.js bulunamadi!
echo OpenScriv'i calistirmak icin Node.js 20+ gereklidir.
echo Lutfen https://nodejs.org adresinden Node.js kurun.
pause
exit /b 1

:no_npm
echo [HATA] npm komutu bulunamadi! Lutfen Node.js kurulumunuzu kontrol edin.
pause
exit /b 1

:deps_failed
echo [HATA] Bagimlilik kurulumu basarisiz oldu!
pause
exit /b 1

:build_failed
echo [HATA] Uygulama derlenirken hata olustu!
pause
exit /b 1
