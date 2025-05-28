@echo off
echo ======================================
echo   Persian Date Extension - Quick Test
echo ======================================
echo.

echo Checking extension files...
if exist "manifest.json" (
    echo ✅ manifest.json found
) else (
    echo ❌ manifest.json missing
    pause
    exit /b 1
)

if exist "content.js" (
    echo ✅ content.js found
) else (
    echo ❌ content.js missing
    pause
    exit /b 1
)

if exist "lib\persian-date.js" (
    echo ✅ persian-date.js library found
) else (
    echo ❌ persian-date.js library missing
    pause
    exit /b 1
)

if exist "date-format-test.html" (
    echo ✅ test page found
) else (
    echo ❌ test page missing
    pause
    exit /b 1
)

echo.
echo ======================================
echo   All files present! Ready to test.
echo ======================================
echo.
echo Next steps:
echo 1. Open Chrome browser
echo 2. Go to chrome://extensions/
echo 3. Enable "Developer mode" (top right)
echo 4. Click "Load unpacked"
echo 5. Select this folder: %cd%
echo 6. Open date-format-test.html to test
echo.
echo Opening test page in default browser...
start "" "date-format-test.html"
echo.
pause
