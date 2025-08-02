# Checklist de Deployment - Sistema de Restaurante

## ✅ Preparación Completada

### Base de Datos
- [x] Migración a PostgreSQL (Supabase)
- [x] Configuración de variables de entorno (.env)
- [x] Campos monetarios migrados a Decimal
- [x] Lógica de liberación/ocupación de mesas implementada

### Backend (API)
- [x] Endpoints de autenticación
- [x] Endpoints de gestión de pedidos
- [x] Endpoint de cambio de estado de pedidos
- [x] Endpoint de debug para mesas
- [x] Manejo correcto de estados: PENDING → CONFIRMED → PREPARING → READY → SERVED → COMPLETED

### Frontend
- [x] Panel de mesero con gestión de pedidos
- [x] Panel de administrador
- [x] Formateo correcto de decimales
- [x] Botones de cambio de estado de pedidos
- [x] Feedback visual para operaciones

### Funcionalidades Principales
- [x] Reutilización de mesas manteniendo historial
- [x] Liberación automática de mesas al completar pedidos
- [x] Gestión de inventario y menú
- [x] Cálculo correcto de totales y subtotales

## 🚀 Pasos para Deployment

### 1. Verificación Final
```bash
# Instalar dependencias
pnpm install

# Generar cliente de Prisma
pnpm db:generate

# Verificar build
pnpm build
```

### 2. Variables de Entorno para Producción
Crear archivo `.env.production` o configurar en la plataforma de deployment:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

### 3. Migraciones en Producción
```bash
# Aplicar migraciones
npx prisma migrate deploy

# Opcional: Ejecutar seed
npx prisma db seed
```

### 4. Opciones de Deployment

#### A. Vercel (Recomendado para Next.js)
1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Deploy automático

#### B. Railway
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático

#### C. Netlify
1. Conectar repositorio
2. Configurar build commands
3. Deploy automático

#### D. Docker (Manual)
1. Crear Dockerfile
2. Build imagen
3. Deploy en servidor

## 📝 Configuraciones Adicionales

### Build Commands
```json
{
  "build": "prisma generate && next build",
  "start": "next start",
  "postinstall": "prisma generate"
}
```

### Variables de Entorno Necesarias
- `DATABASE_URL`: Conexión pooled de Supabase
- `DIRECT_URL`: Conexión directa de Supabase
- `NEXTAUTH_SECRET`: Secreto para autenticación
- `NEXTAUTH_URL`: URL base de la aplicación

## 🔍 Testing Post-Deployment

### Endpoints a Verificar
- [ ] `/api/auth/login` - Autenticación
- [ ] `/api/orders` - Gestión de pedidos
- [ ] `/api/tables` - Estado de mesas
- [ ] `/api/menu-items` - Items del menú
- [ ] `/api/debug/table-status` - Debug de mesas

### Flujos a Probar
- [ ] Crear pedido → Mesa ocupada
- [ ] Completar pedido → Mesa liberada
- [ ] Reutilizar mesa → Nuevo pedido
- [ ] Verificar historial de pedidos

## 🎯 Próximos Pasos Opcionales
- [ ] Configurar SSL/HTTPS
- [ ] Implementar monitoreo
- [ ] Configurar backups automáticos
- [ ] Optimizar performance
- [ ] Agregar analytics
