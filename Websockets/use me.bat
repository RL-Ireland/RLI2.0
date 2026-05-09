@echo off

set mypath=%cd%
start "" "%mypath%\starts.bat"
TIMEOUT /T 3
powershell -ExecutionPolicy Bypass -File "start_sos.ps1"

pause