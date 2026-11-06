@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Для запуска нужен Node.js 22 или новее: https://nodejs.org/
  pause
  exit /b 1
)
start "" "http://127.0.0.1:4174/"
node scripts/serve.mjs 4174
pause
