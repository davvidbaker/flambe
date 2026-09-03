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

where nmake >nul 2>&1
if errorlevel 1 (
  echo nmake was not found after activating the Visual Studio C++ environment.
  exit /b 1
)

where cl >nul 2>&1
if errorlevel 1 (
  echo cl.exe was not found after activating the Visual Studio C++ environment.
  exit /b 1
)

rem bcrypt_elixir uses elixir_make, which selects nmake and Makefile.win on
rem Windows when nmake is available. Activating vcvars64 above prevents its
rem fallback to a Unix-style make build that produces an unloadable .so NIF.

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
