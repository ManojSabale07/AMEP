@echo off
echo ====================================
echo Starting AMEP Backend Server
echo ====================================
echo.

cd /d "%~dp0"

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing/Checking dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ====================================
echo Starting Flask Server on port 8000
echo ====================================
echo.
echo Backend will be available at: http://localhost:8000
echo Health check: http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the server
echo.

python app.py

pause
