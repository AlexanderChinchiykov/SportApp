@echo off
echo Building and starting the Sports Community Application...

:: Step 1: Navigate to the frontend-react directory and install dependencies
cd frontend-react
echo Installing React dependencies...
call npm install --legacy-peer-deps
if %ERRORLEVEL% neq 0 (
    echo Error installing React dependencies
    exit /b 1
)

:: Step 2: Build the React application
echo Building React application...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error building React application
    exit /b 1
)

:: Step 3: Go back to the app directory
cd ..

:: Step 4: Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo Error installing Python dependencies
    exit /b 1
)

:: Step 5: Start the FastAPI application
echo Starting FastAPI application...
echo Access the application at http://localhost:8000
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

exit /b 0 