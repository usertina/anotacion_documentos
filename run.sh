#!/bin/bash

echo "========================================="
echo "  ANOTADOR DE DOCUMENTOS INTELIGENTE"
echo "========================================="
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null
then
    echo "❌ ERROR: Python 3 no está instalado"
    echo "Por favor instala Python 3.8 o superior"
    exit 1
fi

echo "✅ Python encontrado: $(python3 --version)"

# Verificar entorno virtual
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creando entorno virtual..."
    python3 -m venv venv
    echo "✅ Entorno virtual creado"
fi

# Activar entorno virtual
echo ""
echo "🔧 Activando entorno virtual..."
source venv/bin/activate

# Instalar dependencias
echo ""
echo "📥 Instalando/verificando dependencias..."
pip install -q -r requirements.txt
echo "✅ Dependencias instaladas"

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  ADVERTENCIA: No existe archivo .env"
    echo "   Copiando .env.example a .env..."
    cp .env.example .env
    echo "   ⚠️  IMPORTANTE: Edita .env y configura tu GEMINI_API_KEY"
fi

# Crear carpetas necesarias
mkdir -p uploads annotated_docs

# Verificar poppler (para PDFs)
if ! command -v pdfinfo &> /dev/null
then
    echo ""
    echo "⚠️  ADVERTENCIA: poppler-utils no está instalado"
    echo "   La conversión de PDFs podría no funcionar"
    echo "   Instala con: sudo apt-get install poppler-utils (Ubuntu/Debian)"
    echo "               o: brew install poppler (Mac)"
fi

echo ""
echo "========================================="
echo "🚀 INICIANDO SERVIDOR..."
echo "========================================="
echo ""
echo "📍 URL: http://localhost:5001"
echo "🛑 Para detener: Ctrl+C"
echo ""

# Ejecutar aplicación
python app.py
