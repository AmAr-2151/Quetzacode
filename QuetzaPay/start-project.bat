@echo off
echo Iniciando QuetzaPay...
echo.

echo 1. Iniciando Backend (Puerto 3001)...
cd backend
start cmd /k "npm run dev"
timeout 3

echo 2. Iniciando Frontend (Puerto 3000)...
cd ..\frontend
start cmd /k "npm run dev"
timeout 3

echo.
echo ✅ Proyecto iniciado!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:3001
echo.
pause