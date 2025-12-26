@echo off
REM Voice Flow Deployment Helper Script for Windows
REM This script helps you deploy the Voice Flow application locally

setlocal enabledelayedexpansion

:menu
cls
echo ================================
echo Voice Flow Deployment Script
echo ================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] Root .env file not found
    echo The .env file with MySQL credentials has been created.
    echo.
)

REM Check if backend/.env exists
if not exist "backend\.env" (
    echo [WARNING] backend/.env file not found
    echo.
    echo Please run option 1 to set up environment files first.
    echo.
)

echo.
echo What would you like to do?
echo   1) Setup environment files (first time)
echo   2) Build and start (full deployment)
echo   3) Start existing containers
echo   4) Stop containers
echo   5) View logs
echo   6) View status
echo   7) Rebuild containers
echo   8) Reset everything (WARNING: deletes database)
echo   9) Exit
echo.

set /p choice="Enter choice [1-9]: "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto build_and_start
if "%choice%"=="3" goto start
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto status
if "%choice%"=="7" goto rebuild
if "%choice%"=="8" goto reset
if "%choice%"=="9" goto end

echo Invalid choice
pause
goto menu

:setup
echo.
echo ================================
echo Setting Up Environment Files
echo ================================
echo.

if exist "backend\.env" (
    echo backend/.env already exists
    echo.
    pause
    goto menu
)

echo Creating backend/.env from template...
copy backend\.env.production backend\.env >nul

echo.
echo [OK] Created backend/.env
echo.
echo IMPORTANT: You need to edit backend/.env and add:
echo   - OPENAI_API_KEY (get from https://platform.openai.com/api-keys)
echo   - Email settings (SMTP or SendGrid)
echo.
echo You can edit it with: notepad backend\.env
echo.
echo After editing, run option 2 to deploy.
echo.
pause
goto menu

:build_and_start
echo.
echo ================================
echo Building and Starting Services
echo ================================
echo.

if not exist "backend\.env" (
    echo [ERROR] backend/.env not found. Please run option 1 first.
    pause
    goto menu
)

echo Building containers (this may take a few minutes)...
docker-compose build --no-cache

if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    goto menu
)

echo.
echo Starting services...
docker-compose up -d

if errorlevel 1 (
    echo [ERROR] Failed to start services
    pause
    goto menu
)

echo.
echo [OK] Services started successfully
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ================================
echo Application URLs
echo ================================
echo Frontend: http://localhost:80
echo Backend:  http://localhost:5000
echo.
echo To view logs: docker-compose logs -f
echo To stop:      Run this script and choose option 4
echo.
pause
goto menu

:start
echo.
echo ================================
echo Starting Containers
echo ================================
echo.
docker-compose up -d
echo.
echo [OK] Containers started
echo.
pause
goto menu

:stop
echo.
echo ================================
echo Stopping Containers
echo ================================
echo.
docker-compose down
echo.
echo [OK] Containers stopped
echo.
pause
goto menu

:logs
echo.
echo ================================
echo Container Logs
echo ================================
echo Press Ctrl+C to exit
echo.
docker-compose logs -f
pause
goto menu

:status
echo.
echo ================================
echo Container Status
echo ================================
echo.
docker-compose ps
echo.
pause
goto menu

:rebuild
echo.
echo ================================
echo Rebuilding Containers
echo ================================
echo.
docker-compose down
echo Building containers...
docker-compose build --no-cache
echo Starting services...
docker-compose up -d
echo.
echo [OK] Containers rebuilt and started
echo.
pause
goto menu

:reset
echo.
echo ================================
echo WARNING
echo ================================
echo This will DELETE ALL DATA including the database!
echo.
set /p confirm="Are you sure? (yes/no): "

if /i "%confirm%"=="yes" (
    echo.
    echo Removing everything...
    docker-compose down -v
    echo.
    echo [OK] Everything reset
) else (
    echo.
    echo [CANCELLED]
)
echo.
pause
goto menu

:end
echo.
echo Goodbye!
timeout /t 2 >nul
exit /b 0
