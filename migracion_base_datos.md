# Migración de Base de Datos — Sistema de Turnos (versión final)

Documento técnico que describe el esquema final de la base de datos y los cambios aplicados respecto al modelo original.

---

## Decisiones de diseño aplicadas

- **Un horario corresponde a un servicio** (relación 1:N).
- **Los horarios definen un rango de fechas** (`fechaInicio` / `fechaFin`).
- **Las franjas se materializan en la base** al crear el horario, generadas automáticamente según `servicios.duracionMinutos`.
- **La duración del bloque la define el servicio** (no hay `lapsoMinutos` separado).
- **El profesional cuelga del servicio**, no del horario.
- **Bloqueos manuales** = franjas con estado `Bloqueada` (no requieren tabla aparte).
- **ENUMs reemplazados por tablas catálogo** (1FN estricta).
- **Notificaciones siempre atadas a un turno** (`turnoId NOT NULL`).
- **Un usuario tiene un solo rol.**

---

## Esquema final (DDL)

```sql
-- ============================================================
-- TABLAS DE CATÁLOGO
-- ============================================================

CREATE TABLE roles (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(200)
);

CREATE TABLE estados_franja (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE estados_turno (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tipos_notificacion (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

-- ============================================================
-- USUARIOS Y SERVICIOS
-- ============================================================

CREATE TABLE usuarios (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  creadoEn DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  rolId VARCHAR(36) NOT NULL,
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (rolId) REFERENCES roles(id)
);

CREATE TABLE servicios (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  duracionMinutos INT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  profesionalId VARCHAR(36) NOT NULL,
  CONSTRAINT fk_servicios_profesional FOREIGN KEY (profesionalId) REFERENCES usuarios(id),
  CONSTRAINT chk_duracion_positiva CHECK (duracionMinutos > 0),
  CONSTRAINT chk_precio_no_negativo CHECK (precio >= 0)
);

-- ============================================================
-- HORARIOS Y FRANJAS
-- ============================================================

CREATE TABLE horarios (
  id VARCHAR(36) PRIMARY KEY,
  fechaInicio DATE NOT NULL,
  fechaFin DATE NOT NULL,
  horaApertura TIME NOT NULL,
  horaCierre TIME NOT NULL,
  servicioId VARCHAR(36) NOT NULL,
  CONSTRAINT fk_horarios_servicio FOREIGN KEY (servicioId) REFERENCES servicios(id) ON DELETE CASCADE,
  CONSTRAINT chk_rango_fechas CHECK (fechaFin >= fechaInicio),
  CONSTRAINT chk_rango_horas CHECK (horaCierre > horaApertura)
);

CREATE INDEX idx_horarios_servicio ON horarios (servicioId);
CREATE INDEX idx_horarios_rango ON horarios (fechaInicio, fechaFin);

CREATE TABLE franjas_horarias (
  id VARCHAR(36) PRIMARY KEY,
  fecha DATE NOT NULL,
  horaInicio TIME NOT NULL,
  horaFin TIME NOT NULL,
  motivoBloqueo TEXT,
  horarioId VARCHAR(36) NOT NULL,
  estadoFranjaId VARCHAR(36) NOT NULL,
  CONSTRAINT fk_franja_horario FOREIGN KEY (horarioId) REFERENCES horarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_franja_estado FOREIGN KEY (estadoFranjaId) REFERENCES estados_franja(id),
  CONSTRAINT chk_franja_horas CHECK (horaFin > horaInicio)
);

CREATE INDEX idx_franja_horario ON franjas_horarias (horarioId);
CREATE INDEX idx_franja_fecha ON franjas_horarias (fecha);
CREATE INDEX idx_franja_estado ON franjas_horarias (estadoFranjaId);

-- ============================================================
-- TURNOS Y NOTIFICACIONES
-- ============================================================

CREATE TABLE turnos (
  id VARCHAR(36) PRIMARY KEY,
  notas TEXT,
  creadoEn DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  clienteId VARCHAR(36) NOT NULL,
  franjaId VARCHAR(36) NOT NULL,
  estadoTurnoId VARCHAR(36) NOT NULL,
  CONSTRAINT fk_turno_cliente FOREIGN KEY (clienteId) REFERENCES usuarios(id),
  CONSTRAINT fk_turno_franja FOREIGN KEY (franjaId) REFERENCES franjas_horarias(id),
  CONSTRAINT fk_turno_estado FOREIGN KEY (estadoTurnoId) REFERENCES estados_turno(id)
);

CREATE INDEX idx_turno_cliente ON turnos (clienteId);
CREATE INDEX idx_turno_franja ON turnos (franjaId);
CREATE INDEX idx_turno_estado ON turnos (estadoTurnoId);

CREATE TABLE notificaciones (
  id VARCHAR(36) PRIMARY KEY,
  mensaje TEXT NOT NULL,
  fechaEnvio DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  leida TINYINT NOT NULL DEFAULT 0,
  turnoId VARCHAR(36) NOT NULL,
  tipoNotificacionId VARCHAR(36) NOT NULL,
  CONSTRAINT fk_notif_turno FOREIGN KEY (turnoId) REFERENCES turnos(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_tipo FOREIGN KEY (tipoNotificacionId) REFERENCES tipos_notificacion(id)
);

CREATE INDEX idx_notif_turno ON notificaciones (turnoId);
```

---

## Seeds iniciales

```sql
-- Roles
INSERT INTO roles (id, nombre, descripcion) VALUES
  (UUID(), 'Cliente',     'Usuario que reserva turnos'),
  (UUID(), 'Profesional', 'Usuario que ofrece servicios');

-- Estados de franja
INSERT INTO estados_franja (id, nombre) VALUES
  (UUID(), 'Libre'),
  (UUID(), 'Ocupada'),
  (UUID(), 'Bloqueada');

-- Estados de turno
INSERT INTO estados_turno (id, nombre) VALUES
  (UUID(), 'Pendiente'),
  (UUID(), 'Confirmado'),
  (UUID(), 'Cancelado'),
  (UUID(), 'Completado'),
  (UUID(), 'No asistió');

-- Tipos de notificación
INSERT INTO tipos_notificacion (id, nombre) VALUES
  (UUID(), 'Recordatorio'),
  (UUID(), 'Confirmación'),
  (UUID(), 'Cancelación'),
  (UUID(), 'Reprogramación');
```

---

## Resumen de la estructura

```
roles ──< usuarios ──< servicios ──< horarios ──< franjas_horarias ──< turnos
                          (profesional)                                    │
                                                                  estados_franja
                                                                           │
                                                              estados_turno
                                                                           │
                                                              notificaciones
                                                                           │
                                                            tipos_notificacion
```

- **Una franja conoce su fecha y hora** → consultas directas sobre disponibilidad.
- **Estado de franja vía FK** → 1FN, sin ENUMs.
- **Bloqueos manuales** = franjas con `estadoFranjaId = Bloqueada` y `motivoBloqueo` poblado.
- **Una sola fuente de duración:** `servicios.duracionMinutos`.
