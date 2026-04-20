# 📋 Guía de Uso - Sistema de Turnos

## 🚀 Primer Uso

### Paso 1: Crear el Administrador
1. Ve a `http://localhost:3000/setup`
2. Completa el formulario:
   - **Nombre**: Tu nombre (ej: "Admin Sistema")
   - **Email**: Email único (ej: "admin@ejemplo.com")
   - **Contraseña**: Mínimo 6 caracteres
3. Haz clic en "✓ Crear Administrador"
4. Se abrirá el login automáticamente

---

## 👨‍💼 Como Administrador

### Crear Horarios Disponibles
1. Inicia sesión con tu cuenta admin
2. Ve a `http://localhost:3000/admin/horarios`
3. En el formulario de la izquierda, completa:
   - **Fecha**: Selecciona una fecha futura (mañana, próxima semana, etc.)
   - **Hora Inicio**: Por ejemplo, "09:00"
   - **Hora Fin**: Por ejemplo, "10:00" (debe ser mayor que la hora inicio)
4. Haz clic en "+ Crear horario"
5. Verás el horario listado debajo con su disponibilidad

### Ver todos los Turnos
1. En el panel admin, ve a "Turnos"
2. Verás una tabla con:
   - Fecha y hora del turno
   - Nombre del cliente que lo reservó
   - Estado actual
   - Opción para cancelar

---

## 👤 Como Usuario Regular

### Registrarse
1. Ve a `http://localhost:3000/register`
2. Completa:
   - Nombre
   - Email
   - Contraseña
3. Haz clic en "Registrarse"
4. Se abrirá el login automáticamente

### Reservar un Turno
1. Inicia sesión con tu cuenta
2. Ve a "Disponibilidad" (en el menú)
3. Verás horarios agrupados por fecha
4. Haz clic en el botón "Reservar" en cualquier horario disponible
5. Recibirás confirmación

### Ver Mis Turnos
1. Haz clic en "Mis Turnos" (en el menú)
2. Verás dos secciones:
   - **Turnos próximos**: Los que aún no se usan
   - **Turnos cancelados**: Los que cancelaste
3. Puedes cancelar un turno desde aquí

---

## 🔧 Notas Técnicas

### URLs de la Aplicación
- **Home**: `http://localhost:3000/`
- **Setup Inicial**: `http://localhost:3000/setup` (solo primera vez)
- **Login**: `http://localhost:3000/login`
- **Registrarse**: `http://localhost:3000/register`
- **Disponibilidad**: `http://localhost:3000/disponibilidad` (requiere login)
- **Mis Turnos**: `http://localhost:3000/mis-turnos` (requiere login)
- **Admin - Horarios**: `http://localhost:3000/admin/horarios` (solo admin)
- **Admin - Turnos**: `http://localhost:3000/admin/turnos` (solo admin)

### Base de Datos
El sistema usa MySQL. Asegúrate de que:
1. MySQL esté corriendo
2. Las credenciales en `.env` sean correctas
3. La base de datos exista (se crea automáticamente con TypeORM)

### API Endpoints
- `POST /api/setup` - Crear admin inicial
- `POST /api/auth/register` - Registrarse como usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/horarios` - Obtener horarios disponibles
- `POST /api/horarios` - Crear horario (admin)
- `GET /api/turnos/mis-turnos` - Obtener mis turnos
- `POST /api/turnos/reservar` - Reservar un turno
- `PATCH /api/turnos/:id/cancelar` - Cancelar un turno

---

## 🐛 Troubleshooting

### "Error: Ya existe un administrador en el sistema"
- La página `/setup` solo funciona UNA sola vez
- Si necesitas crear otro admin, edita la base de datos:
  ```sql
  UPDATE usuarios SET rol = 'admin' WHERE email = 'tu@email.com';
  ```

### "No puedo ver el panel admin"
- Verifica que iniciaste sesión como admin
- Si no eres admin, no verás el menú de admin
- La URL redirige automáticamente a `/mis-turnos` si no eres admin

### "No veo los horarios que creé"
- Asegúrate de haber iniciado sesión primero
- Los horarios deben tener una fecha futura
- Recarga la página si no aparecen

### "El botón de reservar no funciona"
- Verifica que estés logueado como usuario (no admin)
- Recarga la página
- Revisa la consola del navegador (F12) para ver errores

---

## 📱 Flujo Completo (Ejemplo)

1. **Inicio**: Admin se registra en `/setup`
2. **Admin**: Crea horario mañana de 09:00 a 10:00 en `/admin/horarios`
3. **Usuario**: Se registra en `/register`
4. **Usuario**: Ve el horario en `/disponibilidad` y hace clic en "Reservar"
5. **Usuario**: Ve su turno en `/mis-turnos`
6. **Admin**: Ve el turno en `/admin/turnos`
7. **Usuario**: Puede cancelar en `/mis-turnos` si quiere

---

**¡Listo! El sistema está completamente funcional.** 🎉
