@echo off
echo.
echo ========================================
echo   Dad's Medical Tracker - Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo [1] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [2] Creating .env file...
if not exist "backend\.env" (
    copy backend\.env.example backend\.env
    echo .env file created. Edit it if needed.
) else (
    echo .env file already exists
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo    - If local: Start "MongoDB" service from Services.msc
echo    - If cloud: Ensure MongoDB Atlas cluster is active
echo.
echo 2. Start the backend:
echo    cd backend
echo    npm start
echo.
echo 3. Open the app in your browser:
echo    Open: d:\dad\frontend\index.html
echo.
echo See QUICKSTART.md for more details
echo.
pause
