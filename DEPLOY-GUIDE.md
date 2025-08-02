# 🚀 Guía de Deployment - Sistema de Restaurante

## ✅ Preparación Completada
- ✅ Build exitoso (`pnpm build` funciona)
- ✅ Base de datos PostgreSQL (Supabase) configurada
- ✅ Variables de entorno documentadas
- ✅ Configuración de Vercel lista

## 🎯 Opción 1: Deployment en Vercel (Recomendado)

### Paso a Paso:

1. **Subir código a GitHub**
   ```bash
   git add .
   git commit -m "Preparar para deployment"
   git push origin main
   ```

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu cuenta de GitHub
   - Importa el repositorio `restaurant-system`

3. **Configurar Variables de Entorno en Vercel**
   En el dashboard de Vercel → Settings → Environment Variables:
   ```
   DATABASE_URL = postgresql://postgres.pvwwmkotrmcctbllwyfd:TU_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   
   DIRECT_URL = postgresql://postgres.pvwwmkotrmcctbllwyfd:TU_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   
   NEXTAUTH_SECRET = genera-una-clave-secreta-larga-y-segura
   
   NEXTAUTH_URL = https://tu-proyecto.vercel.app
   ```

4. **Deploy Automático**
   - Vercel detectará Next.js automáticamente
   - El build command será: `prisma generate && next build`
   - Deploy automático en cada push

### Aplicar Migraciones
Después del primer deploy, ejecuta en tu terminal local:
```bash
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## 🎯 Opción 2: Railway

1. **Conectar repositorio**
   - Ve a [railway.app](https://railway.app)
   - Conecta GitHub y selecciona el repo

2. **Variables de entorno**
   ```
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   NEXTAUTH_SECRET=tu-secreto
   NEXTAUTH_URL=https://tu-app.railway.app
   ```

3. **Deploy automático**

---

## 🎯 Opción 3: Netlify

1. **Build Settings**
   - Build command: `pnpm build`
   - Publish directory: `.next`

2. **Variables de entorno** (igual que Vercel)

---

## 🧪 Testing Post-Deployment

### URLs a verificar:
- `/` - Página principal
- `/mesero` - Panel de mesero
- `/admin` - Panel de administrador
- `/api/debug/table-status` - Estado de mesas

### Flujo de prueba:
1. Crear un pedido
2. Verificar que la mesa se marca como ocupada
3. Cambiar estado del pedido a completado
4. Verificar que la mesa se libera
5. Crear nuevo pedido en la misma mesa

## 📱 Comandos Útiles

```bash
# Ver logs de Vercel
vercel logs

# Ejecutar migraciones en producción
npx prisma migrate deploy

# Ver estado de la base de datos
npx prisma studio

# Regenerar cliente de Prisma
npx prisma generate
```

## 🔧 Troubleshooting

### Error de Prisma Client
Si aparece error de Prisma Client:
1. Verifica que `prisma generate` esté en el build command
2. Revisa las variables de entorno DATABASE_URL y DIRECT_URL

### Error de CORS
Si hay problemas de CORS, verifica NEXTAUTH_URL

### Error 500 en APIs
Revisa los logs y verifica la conexión a la base de datos

## ✨ ¡Listo para Producción!

Tu sistema de restaurante está preparado con:
- ✅ Gestión completa de pedidos
- ✅ Reutilización de mesas
- ✅ Historial mantenido
- ✅ Estados de pedido correctos
- ✅ Interfaz moderna y responsive
- ✅ Base de datos robusta (PostgreSQL)

🎉 **¡Es hora de hacer el deploy!**
