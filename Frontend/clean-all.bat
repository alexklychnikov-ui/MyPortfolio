@echo off
echo ========================================
echo    🧹 ПОРТФОЛИО - ПОЛНАЯ ОЧИСТКА
echo ========================================
echo.

echo [1/4] Остановка всех процессов...
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM npm.cmd /F >nul 2>&1
taskkill /IM npx.cmd /F >nul 2>&1
echo ✅ Все процессы остановлены

echo.
echo [2/4] Удаление кэша и сборок...
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Удален .next
)
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo ✅ Удален node_modules
)
if exist "out" (
    rmdir /s /q "out"
    echo ✅ Удален out
)

echo.
echo [3/4] Удаление локальных данных...
if exist ".env.local" (
    del ".env.local"
    echo ✅ Удален .env.local
)
if exist "package-lock.json" (
    del "package-lock.json"
    echo ✅ Удален package-lock.json
)

echo.
echo [4/4] Очистка npm кэша...
call npm cache clean --force
echo ✅ NPM кэш очищен

echo.
echo ========================================
echo ✅ ПОЛНАЯ ОЧИСТКА ЗАВЕРШЕНА!
echo ========================================
echo Теперь можно запустить start-dev.bat
echo для чистой установки и запуска
echo.
pause