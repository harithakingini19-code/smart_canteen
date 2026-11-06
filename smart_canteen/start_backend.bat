@echo off
echo ===================================================
echo     Starting Smart Canteen Django Backend Server   
echo ===================================================
cd /d "%~dp0backend"

:: Activate virtual environment if present
if exist "%~dp0smart_canteen\Scripts\activate.bat" (
    echo Activating virtual environment in smart_canteen...
    call "%~dp0smart_canteen\Scripts\activate.bat"
) else if exist "%~dp0venv\Scripts\activate.bat" (
    echo Activating virtual environment in venv...
    call "%~dp0venv\Scripts\activate.bat"
) else if exist "%~dp0.venv\Scripts\activate.bat" (
    echo Activating virtual environment in .venv...
    call "%~dp0.venv\Scripts\activate.bat"
)

:: Set UTF-8 encoding for Python console on Windows
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

echo [1/3] Applying database migrations...
python manage.py makemigrations accounts menu cart orders payments order_queue favorites reviews notifications
python manage.py migrate
echo.
echo [2/3] Seeding initial canteen categories and menu items...
python seed_data.py
echo.
echo [3/3] Starting Django REST Backend on http://127.0.0.1:8000 ...
echo DO NOT CLOSE THIS WINDOW while using Smart Canteen!
echo.
python manage.py runserver 8000
pause
