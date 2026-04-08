# 🔧 Nexus Garage

> **SaaS Multi-Tenant** para talleres mecánicos. Arquitectura de enrutamiento basado en dominios, sin middleware de servidor.

---

## ✨ Features

- **Multi-Tenant por Dominio**: Detecta el `hostname` automáticamente y carga el branding del taller (logo, color, nombre).
- **Panel SuperAdmin**: Gestión centralizada de usuarios, empresas y vinculación de dominios (`talleres_config`).
- **Autenticación Supabase**: Login, bloqueo de usuarios y reset de contraseña vía Edge Functions.
- **Datos por Schema**: Cada taller tiene su propio schema en PostgreSQL (`client_xxx`) con RLS habilitado.
- **Landing Dinámica**: Cada taller ve su propia landing con branding cargado desde Supabase.
- **Skeleton Loading**: UX optimizada con placeholders durante la carga del tenant.

---

## 🧱 Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + TypeScript + Vite |
| Estilos | TailwindCSS |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Deploy | Vercel |
| Multi-Tenant | Domain-based routing (client-side) |

---

## 🚀 Correr localmente

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un `.env` en la raíz (basado en `.env.example`):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Iniciar el servidor

```bash
npm run dev
```

La aplicación estará en `http://localhost:3001`

---

## 🌐 Pruebas Multi-Tenant en Local

Los subdominios `*.localhost` son resueltos automáticamente por los navegadores modernos a `127.0.0.1`. No necesitas modificar el archivo `hosts`.

1. En el panel SuperAdmin → pestaña **"Dominios y Branding"**, agrega:
   - Empresa: selecciona una empresa existente
   - Dominio: `taller1.localhost`

2. Accede en el navegador:

```
http://taller1.localhost:3001
```

El sistema detectará el hostname y cargará el branding configurado.

---

## 🗄️ Estructura de la Base de Datos

```
public.companies         → Empresas/tenants registrados
public.profiles          → Usuarios con company_id
public.talleres_config   → Mapa dominio → branding (logo, color, nombre)
client_xxx.*             → Schema privado por taller (tickets, inventario, etc.)
```

---

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── UsersAdmin.tsx      # Panel SuperAdmin (usuarios + dominios)
│   ├── LandingNexus.tsx    # Landing pública de Nexus (dominio raíz)
│   ├── SkeletonLoader.tsx  # Placeholders de carga
│   └── ...
├── hooks/
│   └── useGarageStore.ts   # Store principal + fetchDomainConfig
├── lib/
│   └── supabase.ts         # Cliente Supabase + GARAGE_SCHEMA
└── App.tsx                 # Enrutamiento por dominio
```

---

## 🔐 Variables de Entorno requeridas en Vercel

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key pública (publishable key) |
