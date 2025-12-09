@echo off
echo =========================================
echo   ANOTADOR DE DOCUMENTOS INTELIGENTE
echo =========================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado
    echo Por favor instala Python 3.8 o superior
    pause
    exit /b 1
)

echo Python encontrado
python --version

REM Verificar entorno virtual
if not exist "venv\" (
    echo.
    echo Creando entorno virtual...
    python -m venv venv
    echo Entorno virtual creado
)

REM Activar entorno virtual
echo.
echo Activando entorno virtual...
call venv\Scripts\activate.bat

REM Instalar dependencias
echo.
echo Instalando/verificando dependencias...
pip install -q -r requirements.txt
echo Dependencias instaladas

REM Verificar archivo .env
if not exist ".env" (
    echo.
    echo ADVERTENCIA: No existe archivo .env
    echo Copiando .env.example a .env...
    copy .env.example .env
    echo IMPORTANTE: Edita .env y configura tu GEMINI_API_KEY
)

REM Crear carpetas necesarias
if not exist "uploads\" mkdir uploads
if not exist "annotated_docs\" mkdir annotated_docs

echo.
echo =========================================
echo INICIANDO SERVIDOR...
echo =========================================
echo.
echo URL: http://localhost:5001
echo Para detener: Ctrl+C
echo.

REM Ejecutar aplicación
python app.py
pause
