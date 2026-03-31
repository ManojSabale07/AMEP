@echo off
echo ====================================
echo AMEP - Create Test Users
echo ====================================
echo.

cd /d "%~dp0"

echo Creating test user accounts...
echo.
python create_test_users.py

echo.
echo ====================================
echo.
echo Test users created! You can now login with:
echo.
echo STUDENT:
echo   Email: student@test.com
echo   Password: student123
echo.
echo TEACHER:
echo   Email: teacher@test.com
echo   Password: teacher123
echo.
echo ====================================
echo.
echo Press any key to start the backend server...
pause > nul

echo.
echo Starting backend server...
python app.py
