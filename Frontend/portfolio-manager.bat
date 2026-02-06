@echo off
chcp 65001 >nul
title 📊 Портфолио - Менеджер

:main_menu
cls
echo ========================================
echo    🎯 ПОРТФОЛИО - ГЛАВНОЕ МЕНЮ
echo ========================================
echo.
echo Выберите действие:
echo.
echo 🚀 1. Запустить dev-сервер
echo 🏗️  2. Собрать для продакшна
echo 📄 3. Обновить JSON данные
echo 🧹 4. Полная очистка
echo 📊 5. Проверить состояние
echo 🚪 6. Выход
echo.
set /p choice="Введите номер (1-6): "

if "%choice%"=="1" goto start_dev
if "%choice%"=="2" goto build_prod
if "%choice%"=="3" goto update_data
if "%choice%"=="4" goto clean_all
if "%choice%"=="5" goto check_status
if "%choice%"=="6" goto exit

echo ❌ Неверный выбор!
timeout /t 2 >nul
goto main_menu

:start_dev
echo.
echo 🚀 Запуск dev-сервера...
call start-dev.bat
goto main_menu

:build_prod
echo.
echo 🏗️  Сборка для продакшна...
call build-production.bat
goto main_menu

:update_data
echo.
echo 📄 Обновление JSON данных...
call update-data.bat
goto main_menu

:clean_all
echo.
echo 🧹 Полная очистка...
call clean-all.bat
goto main_menu

:check_status
echo.
echo 📊 Проверка состояния...
call check-status.bat
goto main_menu

:exit
echo.
echo 👋 До свидания!
timeout /t 2 >nul
exit /b 0