@echo off
echo ========================================
echo    📄 ПОРТФОЛИО - ОБНОВЛЕНИЕ JSON ДАННЫХ
echo ========================================
echo.

echo [1/4] Проверка исходных файлов...
if not exist "..\Data\projects.json" (
    echo ❌ Исходный файл projects.json не найден!
    echo    Ожидается: ..\Data\projects.json
    echo.
    echo 💡 Создаю пример файла с правильной структурой...
    mkdir "..\Data" >nul 2>&1
    echo { > "..\Data\projects.json"
    echo   "id": "example-project", >> "..\Data\projects.json"
    echo   "title": { >> "..\Data\projects.json"
    echo     "ru": "Пример проекта", >> "..\Data\projects.json"
    echo     "en": "Example Project" >> "..\Data\projects.json"
    echo   }, >> "..\Data\projects.json"
    echo   "description": { >> "..\Data\projects.json"
    echo     "ru": "Описание примера проекта на русском языке", >> "..\Data\projects.json"
    echo     "en": "Example project description in English" >> "..\Data\projects.json"
    echo   }, >> "..\Data\projects.json"
    echo   "stack": "Technology Stack", >> "..\Data\projects.json"
    echo   "tag": "https://github.com/example/project" >> "..\Data\projects.json"
    echo } >> "..\Data\projects.json"
    echo.
    echo ✅ Создан пример projects.json
    pause
    exit /b 1
)

if not exist "..\Data\services.json" (
    echo ❌ Исходный файл services.json не найден!
    echo    Ожидается: ..\Data\services.json
    echo.
    echo 💡 Создаю пример файла с правильной структурой...
    mkdir "..\Data" >nul 2>&1
    echo { > "..\Data\services.json"
    echo   "id": "example-service", >> "..\Data\services.json"
    echo   "title": { >> "..\Data\services.json"
    echo     "ru": "Пример услуги", >> "..\Data\services.json"
    echo     "en": "Example Service" >> "..\Data\services.json"
    echo   }, >> "..\Data\services.json"
    echo   "description": { >> "..\Data\services.json"
    echo     "ru": "Описание примера услуги на русском языке", >> "..\Data\services.json"
    echo     "en": "Example service description in English" >> "..\Data\services.json"
    echo   } >> "..\Data\services.json"
    echo } >> "..\Data\services.json"
    echo.
    echo ✅ Создан пример services.json
    pause
    exit /b 1
)

if not exist "..\Data\testimonials.json" (
    echo 💡 Файл testimonials.json не найден, создаю пустой массив...
    mkdir "..\Data" >nul 2>&1
    echo [] > "..\Data\testimonials.json"
    echo ✅ Создан пустой testimonials.json
) else (
    echo ✅ testimonials.json найден
)

echo ✅ Все исходные файлы проверены

echo.
echo [2/4] Создание папки для данных...
if not exist "public\data" (
    mkdir "public\data"
    echo ✅ Создана папка public\data
) else (
    echo ✅ Папка public\data существует
)

echo.
echo [3/4] Копирование файлов...
copy "..\Data\projects.json" "public\data\projects.json" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ projects.json обновлен
) else (
    echo ❌ Ошибка копирования projects.json
)

copy "..\Data\services.json" "public\data\services.json" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ services.json обновлен
) else (
    echo ❌ Ошибка копирования services.json
)

copy "..\Data\testimonials.json" "public\data\testimonials.json" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ testimonials.json обновлен
) else (
    echo ❌ Ошибка копирования testimonials.json
)

echo.
echo [4/4] Проверка JSON синтаксиса...
echo 🔍 Проверяю валидность JSON файлов...

python -m json.tool "public\data\projects.json" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ projects.json - валидный JSON
) else (
    echo ❌ projects.json - ошибка в JSON синтаксисе
)

python -m json.tool "public\data\services.json" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ services.json - валидный JSON
) else (
    echo ❌ services.json - ошибка в JSON синтаксисе
)

python -m json.tool "public\data\testimonials.json" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ testimonials.json - валидный JSON
) else (
    echo ❌ testimonials.json - ошибка в JSON синтаксисе
)

echo.
echo ========================================
echo ✅ JSON ДАННЫЕ ОБНОВЛЕНЫ!
echo ========================================
echo Теперь можно перезагрузить dev-сервер
echo или изменения уже видны в браузере
echo.
pause