@echo off
REM Development installation script for Tippy Blender Link (Windows)
REM Creates a symbolic link from Blender's add-ons directory to your development folder

setlocal enabledelayedexpansion

echo Tippy Blender Link - Development Installation (Windows)
echo ========================================================
echo.

REM Get current directory
set SCRIPT_DIR=%~dp0
set ADDON_DIR=%SCRIPT_DIR%blender_banter_uploader

echo Addon source: %ADDON_DIR%
echo.

REM Common Blender addon paths for Windows
set BLENDER_PATHS[0]=%APPDATA%\Roaming\Blender Foundation\Blender\4.5\scripts\addons

REM Find existing Blender installation
set FOUND_PATH=
for /L %%i in (0,1,9) do (
    if exist "!BLENDER_PATHS[%%i]!\.." (
        echo Found Blender config: !BLENDER_PATHS[%%i]!
        set FOUND_PATH=!BLENDER_PATHS[%%i]!
        goto :found
    )
)

:found
if "%FOUND_PATH%"=="" (
    echo No Blender installation found in standard locations.
    echo Please enter your Blender addons path manually:
    echo ^(e.g., C:\Users\Username\AppData\Roaming\Blender Foundation\Blender\4.0\scripts\addons^)
    set /p FOUND_PATH=Path: 
)

REM Create addons directory if it doesn't exist
if not exist "%FOUND_PATH%" mkdir "%FOUND_PATH%"

REM Remove existing installation if present
set LINK_PATH=%FOUND_PATH%\blender_banter_uploader
if exist "%LINK_PATH%" (
    echo Removing existing installation at %LINK_PATH%
    rmdir /s /q "%LINK_PATH%" 2>nul
    del /q "%LINK_PATH%" 2>nul
)

REM Create symbolic link (requires admin privileges)
echo Creating symbolic link...
mklink /D "%LINK_PATH%" "%ADDON_DIR%"

if %errorlevel% equ 0 (
    echo.
    echo Success! Development link created.
    echo.
    echo Next steps:
    echo 1. Open Blender
    echo 2. Go to Edit ^> Preferences ^> Add-ons
    echo 3. Search for 'Tippy'
    echo 4. Enable 'Tippy Blender Link'
    echo.
    echo You can now edit files in %ADDON_DIR%
    echo and reload the addon in Blender with F3 ^> 'Reload Scripts'
    echo or by disabling and re-enabling the addon.
) else (
    echo.
    echo Failed to create symbolic link.
    echo.
    echo IMPORTANT: This script requires Administrator privileges!
    echo Please run this script as Administrator:
    echo 1. Right-click on install_dev.bat
    echo 2. Select "Run as administrator"
)

pause