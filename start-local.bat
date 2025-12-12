@echo off
echo ========================================
echo Easypaisa Wallet Linking Service
echo Local Development Setup
echo ========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start (30 seconds)...
    timeout /t 30 /nobreak >nul
)

echo.
echo Step 1: Starting PostgreSQL database...
docker-compose up -d postgres

echo.
echo Step 2: Waiting for database to be ready (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo Step 3: Running database migrations...
call npm run migration:run

if %errorlevel% neq 0 (
    echo.
    echo WARNING: Migrations failed. This is normal if already run.
    echo Continuing...
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create a merchant: npm run create:merchant "Your Store Name"
echo 2. Start the app:     npm run start:dev
echo 3. Open Swagger:      http://localhost:3000/api/docs
echo.
echo Press any key to start the application...
pause >nul

echo.
echo Starting application in development mode...
call npm run start:dev
