@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE=%~dp0.tools\node-v22.11.0-win-x64\node.exe"
set "NEXT_BIN=%~dp0node_modules\next\dist\bin\next"

if not exist "%NODE_EXE%" (
  echo Portable Node was not found.
  echo Expected: %NODE_EXE%
  pause
  exit /b 1
)

if not exist "%NEXT_BIN%" (
  echo Dependencies are not installed yet.
  echo Run:
  echo .tools\node-v22.11.0-win-x64\npm.cmd install --ignore-scripts
  pause
  exit /b 1
)

echo Starting AI Code Editor on http://localhost:3000
"%NODE_EXE%" "%NEXT_BIN%" dev -p 3000
