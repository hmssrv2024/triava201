@echo off
REM Script de inicio rápido para Windows
REM Uso: iniciar.bat [puerto]
REM Ejemplo: iniciar.bat 5000

setlocal

REM Usar el puerto proporcionado o 5000 por defecto
if "%1"=="" (
    set PORT=5000
) else (
    set PORT=%1
)

echo.
echo ========================================
echo    Iniciando servidor en puerto %PORT%
echo ========================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Node.js no está instalado
    echo    Descárgalo desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si las dependencias están instaladas
if not exist "node_modules\" (
    echo 📦 Instalando dependencias...
    call npm install
    echo.
)

REM Verificar que existe el archivo .env
if not exist ".env" (
    echo ⚠️  Archivo .env no encontrado, creando uno básico...
    (
        echo REGISTRO_MAX_RECORDS=200
        echo OPENROUTER_API_KEY=sk-test-key
        echo OPENROUTER_REGISTRATION_URL=https://example.com/api
    ) > .env
    echo ✅ Archivo .env creado
    echo.
)

REM Verificar que existe el directorio data
if not exist "data\" (
    echo 📁 Creando directorio data...
    mkdir data
)

REM Verificar que existe registrations.json
if not exist "data\registrations.json" (
    echo 📝 Creando archivo de registros vacío...
    echo [] > data\registrations.json
)

echo ✅ Todo listo!
echo.
echo 🌐 URLs disponibles:
echo    📝 Registro: http://localhost:%PORT%/registro.html
echo    📊 Admin:    http://localhost:%PORT%/admin-registros.html
echo.
echo 🛑 Para detener el servidor: Ctrl + C
echo.
echo ========================================
echo.

REM Iniciar el servidor
set PORT=%PORT%
npm run dev

endlocal
