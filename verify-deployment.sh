#!/bin/bash
# Script de verificación pre-deployment

echo "🔍 Verificando que todo esté listo para deployment..."

# Verificar que existen los archivos necesarios
echo "📁 Verificando archivos necesarios..."
if [ ! -f "package.json" ]; then
  echo "❌ package.json no encontrado"
  exit 1
fi

if [ ! -f "prisma/schema.prisma" ]; then
  echo "❌ prisma/schema.prisma no encontrado"  
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "❌ .env no encontrado"
  exit 1
fi

echo "✅ Archivos necesarios encontrados"

# Verificar dependencias
echo "📦 Verificando dependencias..."
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm no está instalado"
  exit 1
fi

echo "✅ pnpm disponible"

# Instalar dependencias
echo "📥 Instalando dependencias..."
pnpm install

# Generar cliente de Prisma
echo "🔄 Generando cliente de Prisma..."
pnpm db:generate

# Hacer build
echo "🏗️ Construyendo aplicación..."
pnpm build

if [ $? -eq 0 ]; then
  echo "✅ Build exitoso!"
  echo ""
  echo "🎉 ¡Tu aplicación está lista para deployment!"
  echo ""
  echo "📋 Próximos pasos:"
  echo "1. Sube tu código a GitHub"
  echo "2. Ve a vercel.com y conecta tu repositorio"
  echo "3. Configura las variables de entorno (ver .env.example)"
  echo "4. Deploy automático"
  echo ""
  echo "📚 Lee DEPLOY-GUIDE.md para instrucciones detalladas"
else
  echo "❌ Error en el build"
  exit 1
fi
