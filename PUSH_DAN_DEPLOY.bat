@echo off
echo ========================================
echo   ALFAZA LINK - PUSH AND DEPLOY SCRIPT
echo ========================================
echo.

echo [1/4] Menambahkan perubahan ke Git...
git add .

echo [2/4] Membuat commit...
git commit -m "feat(nav): sync bottom navigation design with KINK app and fix responsive landscape layout"
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Tidak ada perubahan kode baru untuk di-commit.
)

echo [3/4] Melakukan Push ke GitHub...
git push
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] GitHub sudah up-to-date.
)

echo [4/4] Membangun dan Deploy ke Firebase...
echo Menjalankan build...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo GAGAL: Proses build bermasalah.
    pause
    exit /b %ERRORLEVEL%
)

echo Menjalankan deploy ke Firebase (Live Kasir)...
call firebase deploy --only hosting:app-kasir
if %ERRORLEVEL% NEQ 0 (
    echo GAGAL: Gagal mengirim ke Firebase. Pastikan sudah login firebase.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================
echo   PROSES SELESAI DENGAN SUKSES!
echo   Aplikasi Anda sudah online.
echo ========================================
pause
