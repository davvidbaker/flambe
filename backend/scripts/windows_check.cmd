@echo off
setlocal
set "MIX_ENV=test"

call "%~dp0windows_setup.cmd"
if errorlevel 1 exit /b %ERRORLEVEL%

pushd "%~dp0.."
call mix precommit
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%
