@echo off
echo Stopping any existing servers...
taskkill /F /IM python.exe /T > nul 2>&1
taskkill /F /IM node.exe /T > nul 2>&1

echo Starting backend server...
start cmd /k "cd app && python main.py"

echo Starting frontend server...
start cmd /k "cd app/frontend-react && npm start"

echo Servers started! Use CTRL+C in each command window to stop. 