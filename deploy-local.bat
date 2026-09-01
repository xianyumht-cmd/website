@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-local.ps1" %*
set "EXIT_CODE=%ERRORLEVEL%"

if "%EXIT_CODE%"=="0" (
    echo [deploy-local] SUCCESS
) else (
    echo [deploy-local] FAILED with exit code %EXIT_CODE%
)

exit /b %EXIT_CODE%
