@echo off
echo ========================================
echo    📊 ПОРТФОЛИО - ПРОВЕРКА СОСТОЯНИЯ
echo ========================================
echo.

echo [1/5] Проверка структуры проекта...
echo 📁 Проверяемые файлы:
if exist "package.json" (
    echo ✅ package.json
) else (
    echo ❌ package.json отсутствует
)

if exist "app\page.tsx" (
    echo ✅ app\page.tsx
) else (
    echo ❌ app\page.tsx отсутствует
)

if exist "components\portfolio" (
    echo ✅ components\portfolio
) else (
    echo ❌ components\portfolio отсутствует
)

if exist "public\data" (
    echo ✅ public\data
) else (
    echo ❌ public\data отсутствует
)

if exist "public\assets" (
    echo ✅ public\assets
) else (
    echo ❌ public\assets отсутствует
)

echo.
echo [2/5] Проверка JSON файлов...
if exist "public\data\projects.json" (
    echo ✅ projects.json найден
    for %%A in ("public\data\projects.json") do echo    Размер: %%~zA байт
) else (
    echo ❌ projects.json отсутствует
)

if exist "public\data\services.json" (
    echo ✅ services.json найден
    for %%A in ("public\data\services.json") do echo    Размер: %%~zA байт
) else (
    echo ❌ services.json отсутствует
)

echo.
echo [3/5] Проверка фото профиля...
if exist "public\assets\profile.jpg" (
    echo ✅ profile.jpg найден
    for %%A in ("public\assets\profile.jpg") do echo    Размер: %%~zA байт
) else (
    echo ❌ profile.jpg отсутствует
)

echo.
echo [4/5] Проверка активных процессов...
for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq node.exe" /FO csv ^| find /v "INFO"') do (
    echo ✅ Node.js процесс активен: %%i
)
if %errorlevel% neq 0 (
    echo ℹ️  Активных процессов Node.js не найдено
)

echo.
echo [5/5] Проверка портов...
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Порт 3000 занят
    netstat -ano | findstr ":3000"
) else (
    echo ℹ️  Порт 3000 свободен
)

echo.
echo ========================================
echo 📋 РЕКОМЕНДАЦИИ:
echo ========================================
echo 🚀 Для запуска: start-dev.bat
echo 🏗️  Для сборки: build-production.bat  
echo 🧹 Для очистки: clean-all.bat
echo.
pause