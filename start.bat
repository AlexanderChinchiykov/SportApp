@echo off
echo Sports and Martial Arts Community App Startup

rem Build the React app first
echo Building React frontend...
call build_react.bat

if %ERRORLEVEL% neq 0 (
    echo Failed to build React app
    pause
    exit /b 1
)

echo Starting FastAPI server...
python -m uvicorn app.main:app --reload

pause 