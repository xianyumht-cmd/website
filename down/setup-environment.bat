@echo off
echo ===================================
echo Environment Setup Script
echo ===================================
echo.

echo [1/4] Checking if Node.js and npm are installed...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please download and install Node.js first.
    echo Download URL: https://nodejs.org/en/download/
    echo After installation, run this script again.
    goto :end
) else (
    echo Node.js is installed: 
    node --version
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo npm is not installed. Please install npm first.
    goto :end
) else (
    echo npm is installed: 
    npm --version
)

echo.
echo [2/4] Installing Terser (JavaScript compression tool)...
echo.

npm install terser --save-dev

echo.
echo [3/4] Installing Clean-CSS (CSS compression tool)...
echo.

npm install clean-css --save-dev

echo.
echo [4/4] Installing Sharp (Image optimization tool)...
echo.

npm install sharp --save-dev

echo.
echo ===================================
echo Environment setup completed!
echo ===================================
echo.
echo You can now run the following commands to optimize website resources:
echo.
echo npm run optimize-js     - Compress JavaScript files
echo npm run optimize-css    - Compress CSS files
echo npm run optimize-images - Optimize PNG images
echo npm run optimize-all    - Run all optimizations
echo.

:end
pause