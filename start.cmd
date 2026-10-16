@echo off
setlocal
cd /d "%~dp0"
set "IHW_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "IHW_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  ) else (
    echo Install Node.js 24 or newer from https://nodejs.org then try again.
    pause
    exit /b 1
  )
)
"%IHW_NODE%" -e "process.exit(Number(process.versions.node.split('.')[0]) < 24 ? 1 : 0)"
if errorlevel 1 (
  echo Node.js 24 or newer is required. Update Node.js from https://nodejs.org.
  pause
  exit /b 1
)
echo Open http://localhost:4173 in your browser after startup.
"%IHW_NODE%" --env-file-if-exists=.env server/index.mjs
pause
