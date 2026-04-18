@echo off
echo Membuka proyek ALFAZA LINK di Antigravity...
start "" "C:\Users\Administrator\AppData\Local\Programs\Antigravity\Antigravity.exe" "c:\Users\Administrator\Desktop\ALFAZA CELL\alfaza-link-official"
echo Menjalankan server pengembangan (npm run dev)...
cd /d "c:\Users\Administrator\Desktop\ALFAZA CELL\alfaza-link-official"
npm run dev
pause
