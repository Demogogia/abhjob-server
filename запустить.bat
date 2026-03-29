@echo off
cd /d "%~dp0"
taskkill /f /im node.exe >nul 2>&1
timeout /t 1 /nobreak >nul
start cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
start http://127.0.0.1:5173
