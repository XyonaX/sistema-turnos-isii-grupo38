# Sistema de Gestión de Turnos Online

**Universidad Nacional del Nordeste — Ingeniería de Software II**
Grupo 38 — Licenciatura en Sistemas de la Información

Aplicación web que permite a clientes reservar turnos online y a administradores gestionar la agenda de un negocio.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js 18+ · Express 4 · TypeScript 5 · TypeORM 0.3 |
| Base de datos | MySQL 8 |
| Frontend | Next.js 16 · React 18 · TypeScript 5 |
| Autenticación | JWT · bcrypt |
| Linting | ESLint · Prettier · EditorConfig |

---

## Estructura del repositorio

```
├── backend/    ← API REST (Express + TypeScript + TypeORM)
└── frontend/   ← Interfaz web (Next.js + React + TypeScript)
```

---

## Requisitos previos

- Node.js >= 18 LTS
- npm >= 9
- MySQL >= 8.0

---

## Instalación y uso

### 1. Clonar el repositorio

```bash
git clone https://github.com/XyonaX/sistema-turnos-isii-grupo38.git
cd sistema-turnos-isii-grupo38
```

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales de MySQL
```

Crear la base de datos en MySQL:
```sql
CREATE DATABASE sistema_turnos;
```

Levantar el servidor (puerto 3001):
```bash
npm run dev
```

### 3. Configurar el frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Editar .env.local si el backend corre en otro puerto
```

Levantar el servidor (puerto 3000):
```bash
npm run dev
```

---

## Scripts disponibles

### Backend
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo desarrollo (hot reload) |
| `npm run build` | Compilar TypeScript a JavaScript |
| `npm start` | Ejecutar versión compilada |
| `npm run lint` | Verificar errores de linting |
| `npm run lint:fix` | Corregir errores automáticamente |
| `npm run format` | Formatear código con Prettier |

### Frontend
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor Next.js en modo desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Ejecutar build de producción |
| `npm run lint` | Verificar errores de linting |
| `npm run lint:fix` | Corregir errores automáticamente |
| `npm run format` | Formatear código con Prettier |

---

## Flujo de trabajo Git

```
main        ← rama de producción (protegida)
└── develop ← rama de integración
    ├── feature/nombre-feature
    ├── fix/nombre-fix
    └── docs/nombre-docs
```

**Nunca hacer push directo a `main`.** Todo cambio entra por Pull Request desde `develop`.

---

## Variables de entorno

### Backend (`backend/.env`)
```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_DATABASE=sistema_turnos
JWT_SECRET=clave_secreta_larga
JWT_EXPIRES_IN=24h
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Equipo

- Gomez Hertler, Lisandro Leonel
- Vargas Portillo, Jonatan Ezequiel
