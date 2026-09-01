@echo off
setlocal

set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
if not exist "%VSWHERE%" (
  echo Visual Studio Build Tools were not found.
  echo Install Visual Studio Build Tools with the Desktop development with C++ workload.
  exit /b 1
)

set "VSINSTALL="
for /f "usebackq tokens=*" %%I in (`"%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VSINSTALL=%%I"

if not defined VSINSTALL (
  echo Visual Studio C++ build tools were not found.
  echo Install the Desktop development with C++ workload and run this script again.
  exit /b 1
)

call "%VSINSTALL%\VC\Auxiliary\Build\vcvars64.bat" >nul
if errorlevel 1 (
  echo Failed to initialize the Visual Studio C++ build environment.
  exit /b 1
)

rem bcrypt_elixir uses elixir_make. Explicitly select nmake so its Windows
rem Makefile builds bcrypt_nif.dll rather than a Unix-style .so.
set "MAKE=nmake"

pushd "%~dp0.."
call mix deps.get || goto :error
call mix ecto.create || goto :error
call mix ecto.migrate || goto :error
popd

exit /b 0

:error
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%
