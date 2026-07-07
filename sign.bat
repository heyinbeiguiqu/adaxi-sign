@echo off
cd /d "%~dp0"

:main
set EXIT_CODE=1

where node >nul 2>&1
if errorlevel 1 goto no_node

if not exist ".env" goto no_env

echo ========================================
echo   Adaxi Sign
echo ========================================
echo.
echo Running, please wait...
echo.

node lib\adaxi.js
set EXIT_CODE=%ERRORLEVEL%

echo.
if %EXIT_CODE% equ 0 goto done_ok
echo Failed, exit code: %EXIT_CODE%
echo If captcha error, run this script again.
goto end

:no_node
echo [ERROR] Node.js not found. Please install Node.js first.
goto end

:no_env
echo [ERROR] .env not found.
echo Copy .env.example to .env and fill in your account info.
goto end

:done_ok
echo Done.

:end
echo.
echo Press Enter to run again. Close this window to exit.
set "__rerun="
set /p "__rerun=> "
echo.
goto main
