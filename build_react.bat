@echo off
echo Building React Frontend Application...

cd app\frontend-react

rem Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please install Node.js and npm first.
    exit /b 1
)

echo Installing dependencies...
call npm install --legacy-peer-deps

if %ERRORLEVEL% neq 0 (
    echo Error installing dependencies
    exit /b 1
)

rem Create a proper index.css if it doesn't exist or needs updating
echo Creating/updating CSS styles...
echo /* Base styles */ > src\index.css
echo body { >> src\index.css
echo   margin: 0; >> src\index.css
echo   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; >> src\index.css
echo   -webkit-font-smoothing: antialiased; >> src\index.css
echo   -moz-osx-font-smoothing: grayscale; >> src\index.css
echo   background-color: #f5f5f5; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .App { >> src\index.css
echo   display: flex; >> src\index.css
echo   flex-direction: column; >> src\index.css
echo   min-height: 100vh; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .header { >> src\index.css
echo   background-color: #2c3e50; >> src\index.css
echo   color: white; >> src\index.css
echo   padding: 1rem; >> src\index.css
echo   display: flex; >> src\index.css
echo   justify-content: space-between; >> src\index.css
echo   align-items: center; >> src\index.css
echo   flex-wrap: wrap; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .header h1 { >> src\index.css
echo   margin: 0; >> src\index.css
echo   font-size: 1.5rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .nav { >> src\index.css
echo   display: flex; >> src\index.css
echo   gap: 1rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .nav a { >> src\index.css
echo   color: white; >> src\index.css
echo   text-decoration: none; >> src\index.css
echo   padding: 0.5rem; >> src\index.css
echo   border-radius: 4px; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .nav a:hover { >> src\index.css
echo   background-color: rgba(255, 255, 255, 0.1); >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .container { >> src\index.css
echo   max-width: 1200px; >> src\index.css
echo   margin: 0 auto; >> src\index.css
echo   padding: 2rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .card { >> src\index.css
echo   background-color: white; >> src\index.css
echo   border-radius: 8px; >> src\index.css
echo   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); >> src\index.css
echo   padding: 2rem; >> src\index.css
echo   margin-bottom: 2rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .form-group { >> src\index.css
echo   margin-bottom: 1rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .form-group label { >> src\index.css
echo   display: block; >> src\index.css
echo   margin-bottom: 0.5rem; >> src\index.css
echo   font-weight: bold; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .form-group input, .form-group textarea { >> src\index.css
echo   width: 100%%; >> src\index.css
echo   padding: 0.75rem; >> src\index.css
echo   border: 1px solid #ddd; >> src\index.css
echo   border-radius: 4px; >> src\index.css
echo   font-size: 1rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .form-footer { >> src\index.css
echo   margin-top: 1.5rem; >> src\index.css
echo   text-align: center; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo button { >> src\index.css
echo   background-color: #3498db; >> src\index.css
echo   color: white; >> src\index.css
echo   border: none; >> src\index.css
echo   border-radius: 4px; >> src\index.css
echo   padding: 0.75rem 1.5rem; >> src\index.css
echo   font-size: 1rem; >> src\index.css
echo   cursor: pointer; >> src\index.css
echo   transition: background-color 0.2s; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo button:hover { >> src\index.css
echo   background-color: #2980b9; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo button:disabled { >> src\index.css
echo   background-color: #bdc3c7; >> src\index.css
echo   cursor: not-allowed; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .error-message { >> src\index.css
echo   color: #e74c3c; >> src\index.css
echo   background-color: #fadbd8; >> src\index.css
echo   padding: 0.75rem; >> src\index.css
echo   border-radius: 4px; >> src\index.css
echo   margin-bottom: 1rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .club-list { >> src\index.css
echo   display: grid; >> src\index.css
echo   grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); >> src\index.css
echo   gap: 2rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .club-card { >> src\index.css
echo   background-color: white; >> src\index.css
echo   border-radius: 8px; >> src\index.css
echo   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); >> src\index.css
echo   overflow: hidden; >> src\index.css
echo   transition: transform 0.2s, box-shadow 0.2s; >> src\index.css
echo   cursor: pointer; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .club-card:hover { >> src\index.css
echo   transform: translateY(-5px); >> src\index.css
echo   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .club-card img { >> src\index.css
echo   width: 100%%; >> src\index.css
echo   height: 200px; >> src\index.css
echo   object-fit: cover; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .club-card-content { >> src\index.css
echo   padding: 1.5rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .club-grid { >> src\index.css
echo   display: grid; >> src\index.css
echo   grid-template-columns: 1fr 2fr; >> src\index.css
echo   gap: 2rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .dashboard-actions { >> src\index.css
echo   display: flex; >> src\index.css
echo   gap: 1rem; >> src\index.css
echo   margin-top: 1.5rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .radio-group, .checkbox-group { >> src\index.css
echo   display: flex; >> src\index.css
echo   gap: 1rem; >> src\index.css
echo } >> src\index.css
echo >> src\index.css
echo .radio-label, .checkbox-label { >> src\index.css
echo   display: flex; >> src\index.css
echo   align-items: center; >> src\index.css
echo   gap: 0.5rem; >> src\index.css
echo   font-weight: normal; >> src\index.css
echo } >> src\index.css
echo >> src\index.css

rem Check if react-scripts is present
if not exist node_modules\react-scripts (
    echo Installing react-scripts...
    call npm install react-scripts --save-dev --legacy-peer-deps
)

rem Make public directory if it doesn't exist
if not exist public mkdir public

rem Create index.html in public if it doesn't exist
if not exist public\index.html (
    echo Creating index.html...
    echo ^<!DOCTYPE html^> > public\index.html
    echo ^<html lang="en"^> >> public\index.html
    echo ^<head^> >> public\index.html
    echo   ^<meta charset="utf-8" /^> >> public\index.html
    echo   ^<meta name="viewport" content="width=device-width, initial-scale=1" /^> >> public\index.html
    echo   ^<title^>Sports and Martial Arts Community^</title^> >> public\index.html
    echo ^</head^> >> public\index.html
    echo ^<body^> >> public\index.html
    echo   ^<noscript^>You need to enable JavaScript to run this app.^</noscript^> >> public\index.html
    echo   ^<div id="root"^>^</div^> >> public\index.html
    echo ^</body^> >> public\index.html
    echo ^</html^> >> public\index.html
)

echo Building the React app...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo Error building React app
    exit /b 1
)

echo React build completed successfully!
echo The build has been saved to app/frontend-react/build
echo You can now run the FastAPI application with: python -m uvicorn app.main:app --reload
cd ..\..

exit /b 0 