@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\ready-check.ps1"
if errorlevel 1 pause && exit /b 1
npm run dev
