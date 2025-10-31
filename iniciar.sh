#!/bin/bash

# Script de inicio rápido para Mac/Linux
# Uso: ./iniciar.sh [puerto]
# Ejemplo: ./iniciar.sh 5000

PORT=${1:-5000}

echo ""
echo "🚀 ======================================"
echo "   Iniciando servidor en puerto $PORT"
echo "========================================="
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "   Descárgalo desde: https://nodejs.org/"
    exit 1
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado, creando uno básico..."
    cat > .env << 'EOF'
REGISTRO_MAX_RECORDS=200
OPENROUTER_API_KEY=sk-test-key
OPENROUTER_REGISTRATION_URL=https://example.com/api
EOF
    echo "✅ Archivo .env creado"
    echo ""
fi

# Verificar que existe el directorio data
if [ ! -d "data" ]; then
    echo "📁 Creando directorio data..."
    mkdir -p data
fi

# Verificar que existe registrations.json
if [ ! -f "data/registrations.json" ]; then
    echo "📝 Creando archivo de registros vacío..."
    echo "[]" > data/registrations.json
fi

echo "✅ Todo listo!"
echo ""
echo "🌐 URLs disponibles:"
echo "   📝 Registro: http://localhost:$PORT/registro.html"
echo "   📊 Admin:    http://localhost:$PORT/admin-registros.html"
echo ""
echo "🛑 Para detener el servidor: Ctrl + C"
echo ""
echo "========================================="
echo ""

# Iniciar el servidor
PORT=$PORT npm run dev
