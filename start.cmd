@echo off
setlocal
cd /d "%~dp0"
set "IHW_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "IHW_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  ) else (
    echo Install Node.js 22.14 or newer from https://nodejs.org then try again.
    pause
    exit /b 1
  )
)
"%IHW_NODE%" -e "const [major,minor]=process.versions.node.split('.').map(Number); process.exit(major < 22 || (major === 22 && minor < 14) ? 1 : 0)"
if errorlevel 1 (
  echo Node.js 22.14 or newer is required. Node.js 24 is recommended for Vercel. Update Node.js from https://nodejs.org.
  pause
  exit /b 1
)
if not exist "node_modules\next\package.json" (
  echo Next.js dependencies are missing. Installing them now...
  where npm >nul 2>nul
  if errorlevel 1 (
    echo npm was not found. Install Node.js 22.14 or newer, then try again.
    pause
    exit /b 1
  )
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
set "IHW_PORT=4173"
netstat -ano | findstr ":4173 .*LISTENING" >nul
if not errorlevel 1 set "IHW_PORT=4174"
echo Open http://localhost:%IHW_PORT% in your browser after startup.
set "PORT=%IHW_PORT%"
"%IHW_NODE%" --env-file-if-exists=.env server/index.mjs
pause
