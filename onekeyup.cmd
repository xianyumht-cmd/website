@echo off
setlocal

set "ONEKEYUP_REPO=%~dp0"
cd /d "%ONEKEYUP_REPO%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ONEKEYUP_REPO%scripts\onekeyup.ps1" %*
set "ONEKEYUP_EXIT=%ERRORLEVEL%"

set "ONEKEYUP_NO_PAUSE="
for %%A in (%*) do if /I "%%~A"=="--no-pause" set "ONEKEYUP_NO_PAUSE=1"

if defined ONEKEYUP_NO_PAUSE goto :onekeyup_exit

echo.
if "%ONEKEYUP_EXIT%"=="0" (
    echo ONEKEYUP FINISHED SUCCESSFULLY
) else (
    echo ONEKEYUP FAILED - exit code %ONEKEYUP_EXIT%
)
pause

:onekeyup_exit
endlocal & exit /b %ONEKEYUP_EXIT%
