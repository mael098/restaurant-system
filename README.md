# 🍽️ Sistema de Gestión de Restaurante

<div align="center">
  
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Sistema profesional de gestión de pedidos para restaurantes**

[Demo](#-características) · [Instalación](#-instalación) · [Documentación](#-documentación)

</div>

---

## 📋 Descripción

Sistema moderno y completo para la gestión de pedidos en restaurantes, diseñado con las últimas tecnologías web. Ofrece una interfaz intuitiva tanto para meseros como administradores, con diseño responsivo y experiencia de usuario optimizada.

## ✨ Características

### 🔐 Sistema de Autenticación
- **Autenticación dual**: Acceso diferenciado para meseros y administradores
- **Sesiones seguras**: Gestión de tokens con cookies HTTP-only
- **Roles de usuario**: Control de permisos por tipo de usuario

### 👨‍🍳 Panel de Administrador
- **Gestión de personal**: 
  - Registro de meseros
  - Activación/desactivación de usuarios
  - Seguimiento de desempeño
- **Historial completo de pedidos**:
  - Visualización detallada de todas las órdenes
  - Filtros y búsqueda avanzada
  - Exportación de reportes
- **Dashboard de estadísticas**:
  - Ventas totales en tiempo real
  - Personal activo
  - Ticket promedio
  - Gráficos y métricas visuales
- **Impresión de tickets**: Generación de tickets térmicos de 80mm

### 🧑‍💼 Panel de Mesero
- **Gestión de pedidos**:
  - Creación rápida de órdenes
  - Asignación de mesas
  - Modificación de pedidos pendientes
- **Menú interactivo**:
  - Búsqueda en tiempo real
  - Filtros por categoría
  - Visualización de precios y descripciones
- **Historial personal**:
  - Seguimiento de pedidos propios
  - Estados de preparación
  - Actualización de status
- **Control de mesas**:
  - Disponibilidad en tiempo real
  - Capacidad y ocupación

## 🎨 Diseño Moderno

### Características Visuales
- ✅ **Diseño responsivo**: Optimizado para móviles, tablets y desktop
- ✅ **Animaciones suaves**: Transiciones y efectos modernos
- ✅ **Glassmorphism**: Efectos de vidrio esmerilado
- ✅ **Gradientes vibrantes**: Paleta de colores profesional
- ✅ **Iconografía clara**: Lucide React icons
- ✅ **Feedback visual**: Estados de carga y confirmación
- ✅ **Dark mode ready**: Preparado para modo oscuro

### Componentes UI
- Shadcn/ui - Componentes accesibles y personalizables
- Radix UI - Primitivas de UI sin estilos
- Tailwind CSS - Utilidades CSS modernas

## 🛠️ Tecnologías

### Frontend
- **Next.js 15.2.4** - Framework React con SSR y App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Shadcn/ui** - Biblioteca de componentes

### Backend
- **Next.js API Routes** - Endpoints RESTful
- **Prisma ORM** - Gestión de base de datos
- **PostgreSQL** - Base de datos relacional

### Herramientas
- **pnpm** - Gestor de paquetes rápido
- **ESLint** - Linter de código
- **Prettier** - Formateador de código

## 📦 Instalación

### Prerrequisitos
- Node.js 18.17 o superior
- PostgreSQL 14 o superior
- pnpm (opcional, pero recomendado)

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/mael098/restaurant-system.git
cd restaurant-system
```

2. **Instalar dependencias**
```bash
pnpm install
# o
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env
cp .env.example .env

# Editar .env con tus credenciales
DATABASE_URL="postgresql://user:password@localhost:5432/restaurant_system"
DIRECT_URL="postgresql://user:password@localhost:5432/restaurant_system"
```

4. **Crear la base de datos**
```bash
# Crear base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE restaurant_system;"
```

5. **Ejecutar migraciones**
```bash
pnpm db:migrate
# o
npm run db:migrate
```

6. **Poblar base de datos con datos de ejemplo**
```bash
pnpm db:seed
# o
npm run db:seed
```

7. **Iniciar servidor de desarrollo**
```bash
pnpm dev
# o
npm run dev
```

8. **Abrir en navegador**
```
http://localhost:3000
```

## 🔑 Credenciales por Defecto

### Administrador
- **Usuario**: `admin@restaurant.com`
- **Contraseña**: `admin123`

### Meseros
Los meseros se registran desde el panel de administrador. Cualquier nombre registrado puede iniciar sesión.

## 📱 Uso

### Para Meseros

1. **Iniciar sesión**
   - Seleccionar tab "Mesero"
   - Ingresar nombre registrado

2. **Crear pedido**
   - Seleccionar mesa disponible
   - Buscar o filtrar items del menú
   - Agregar productos al pedido
   - Guardar pedido

3. **Gestionar pedidos**
   - Ver historial en tab "Mis Pedidos"
   - Actualizar estados (Pendiente → Preparando → Listo → Servido → Completado)
   - Agregar items a pedidos pendientes

### Para Administradores

1. **Iniciar sesión**
   - Seleccionar tab "Admin"
   - Ingresar contraseña

2. **Gestionar personal**
   - Registrar nuevos meseros
   - Activar/desactivar usuarios
   - Ver estadísticas de desempeño

3. **Supervisar operaciones**
   - Ver todos los pedidos en tiempo real
   - Revisar estadísticas de ventas
   - Generar reportes

## 🗄️ Estructura del Proyecto

```
restaurant-system/
├── app/                      # App Router de Next.js
│   ├── admin/               # Panel de administrador
│   ├── mesero/              # Panel de mesero
│   ├── api/                 # API Routes
│   │   ├── auth/           # Autenticación
│   │   ├── orders/         # Gestión de pedidos
│   │   ├── menu/           # Menú
│   │   └── waiters/        # Meseros
│   ├── globals.css         # Estilos globales
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Página de login
├── components/              # Componentes React
│   └── ui/                 # Componentes de Shadcn/ui
├── lib/                     # Utilidades y helpers
│   ├── auth/               # Autenticación
│   ├── db/                 # Acceso a BD
│   └── generated/          # Prisma Client
├── prisma/                  # Configuración de Prisma
│   ├── schema.prisma       # Esquema de BD
│   ├── seed.ts             # Datos de ejemplo
│   └── migrations/         # Migraciones
├── public/                  # Archivos estáticos
└── styles/                  # Estilos adicionales
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor de desarrollo
pnpm build            # Compilar para producción
pnpm start            # Iniciar servidor de producción
pnpm lint             # Ejecutar linter

# Base de datos
pnpm db:generate      # Generar Prisma Client
pnpm db:migrate       # Ejecutar migraciones
pnpm db:seed          # Poblar base de datos
pnpm db:studio        # Abrir Prisma Studio
pnpm db:reset         # Resetear base de datos
```

## 🚀 Deployment

### Vercel (Recomendado)

1. Conectar repositorio en [Vercel](https://vercel.com)
2. Configurar variables de entorno
3. Deploy automático

### Docker

```bash
# Construir imagen
docker build -t restaurant-system .

# Ejecutar contenedor
docker run -p 3000:3000 restaurant-system
```

## 📊 Modelo de Datos

### Entidades Principales

- **User**: Usuarios del sistema (meseros y admins)
- **UserSession**: Sesiones activas
- **Table**: Mesas del restaurante
- **MenuItem**: Items del menú
- **MenuCategory**: Categorías del menú
- **Order**: Pedidos
- **OrderItem**: Items de cada pedido

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

## 👨‍💻 Autor

**Mael098**
- GitHub: [@mael098](https://github.com/mael098)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/)
- [Vercel](https://vercel.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">
  <p>⭐ Si te gustó este proyecto, considera darle una estrella en GitHub</p>
  <p>Hecho con ❤️ y ☕</p>
</div>
