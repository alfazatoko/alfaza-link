@echo off
echo ========================================
echo   ALFAZA LINK - PUSH AND DEPLOY SCRIPT
echo ========================================
echo.

echo [1/4] Menambahkan perubahan ke Git...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo GAGAL: git add .
    pause
    exit /b %ERRORLEVEL%
)

echo [2/4] Membuat commit...
git commit -m "Update Alfaza Link: Perubahan sistem dan UI terbaru"
if %ERRORLEVEL% NEQ 0 (
    echo GAGAL atau Tidak ada perubahan untuk commit.
)

echo [3/4] Melakukan Push ke GitHub...
git push
if %ERRORLEVEL% NEQ 0 (
    echo GAGAL: git push
    pause
    exit /b %ERRORLEVEL%
)

echo [4/4] Membangun dan Deploy ke Firebase...
echo Menjalankan build...
call npm run build:firebase
if %ERRORLEVEL% NEQ 0 (
    echo GAGAL: npm run build:firebase
    pause
    exit /b %ERRORLEVEL%
)

echo Menjalankan deploy...
call firebase deploy
if %ERRORLEVEL% NEQ 0 (
    echo GAGAL: firebase deploy
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================
echo   PROSES SELESAI DENGAN SUKSES!
echo ========================================
pause
