# Instrucciones para Claude Code — Refactor de Base de Datos

Este documento describe los cambios a realizar en el proyecto para alinear el código con el nuevo esquema de base de datos definido en `MIGRACION.md`.

**Importante:** No asumas nada sobre la estructura del proyecto antes de inspeccionarlo. Las instrucciones siguen un orden específico para evitar errores.

---

## Stack del proyecto

- **Backend:** Node.js + Express + TypeScript (asumido)
- **ORM:** TypeORM o Sequelize (a determinar inspeccionando `package.json`)
- **DB:** MySQL / MariaDB
- **Datos actuales:** descartables (es entorno de desarrollo)

---

## Fase 0 — Inspección del proyecto

Antes de modificar nada, **inspeccionar** y reportar al usuario qué encontraste:

1. **Leer `package.json`** y determinar:
   - ¿Usa TypeORM (`typeorm` en dependencias) o Sequelize (`sequelize` en dependencias)?
   - ¿Hay scripts de migración (`migration:run`, `db:migrate`, etc.)?
   - ¿Usa TypeScript o JavaScript?

2. **Buscar carpetas relevantes:**
   - `src/entities/` o `src/models/` (modelos del ORM)
   - `src/migrations/` o `migrations/` (migraciones existentes)
   - `src/repositories/` (si existen repositorios)
   - `src/services/` o `src/controllers/` (lógica de negocio)
   - `src/routes/` o `src/controllers/` (endpoints)
   - `ormconfig.json`, `data-source.ts`, `sequelize.config.js` (configuración del ORM)

3. **Identificar archivos de modelos actuales** correspondientes a:
   - usuarios, roles, servicios, horarios, franjas_horarias, turnos, notificaciones

4. **Reportar al usuario** un resumen de lo encontrado antes de proceder. Incluir:
   - ORM detectado
   - Sistema de migraciones (si existe)
   - Lista de archivos que se van a modificar/crear
   - Pedir confirmación antes de continuar.

---

## Fase 1 — Recrear la base de datos

Como los datos son descartables, la forma más limpia es **recrear el schema desde cero**.

### Opción A: Si el proyecto usa migraciones existentes

1. Crear una nueva migración llamada `RefactorSchemaTurnos` (o similar).
2. En el `up()`, hacer DROP de todas las tablas existentes y crearlas según el DDL final (ver `MIGRACION.md` o más abajo).
3. En el `down()`, revertir.
4. Para datos descartables, también es válido borrar las migraciones viejas y empezar limpio si el usuario lo permite — **preguntar antes**.

### Opción B: Si el proyecto no usa migraciones

1. Crear las nuevas entidades del ORM (ver Fase 2).
2. Configurar `synchronize: true` temporalmente en desarrollo (TypeORM) o `sequelize.sync({ force: true })` (Sequelize) para que el ORM recree el schema desde las entidades.
3. Crear un script de seed para los catálogos (ver Fase 4).

**Antes de elegir opción, confirmar con el usuario.**

---

## Fase 2 — Entidades del ORM

Crear o actualizar las siguientes entidades. La nomenclatura usa **camelCase para columnas** y **snake_case para tablas** por convención. **Adaptar** según las convenciones existentes del proyecto.

### 2.1 — Tablas de catálogo

Crear nuevas entidades:

- **`EstadoFranja`** → tabla `estados_franja`
  - `id: string` (PK, UUID)
  - `nombre: string` (UNIQUE, NOT NULL, máx 50)

- **`EstadoTurno`** → tabla `estados_turno`
  - `id: string` (PK, UUID)
  - `nombre: string` (UNIQUE, NOT NULL, máx 50)

- **`TipoNotificacion`** → tabla `tipos_notificacion`
  - `id: string` (PK, UUID)
  - `nombre: string` (UNIQUE, NOT NULL, máx 50)

### 2.2 — `Usuario`

Mantener estructura actual y agregar `UNIQUE` en `email`.

### 2.3 — `Servicio`

- Renombrar `duracion` → `duracionMinutos` (INT NOT NULL).
- Agregar CHECK: `duracionMinutos > 0`.
- Agregar CHECK: `precio >= 0`.
- Mantener `profesionalId` apuntando a `Usuario`.

### 2.4 — `Horario`

Cambios estructurales:

- Eliminar: `fecha`, `lapsoMinutos`, `profesionalId` (si existía).
- Agregar: `fechaInicio: Date`, `fechaFin: Date`, `horaApertura: string` (TIME), `horaCierre: string` (TIME).
- Mantener: `servicioId` (FK a `Servicio`, NOT NULL, ON DELETE CASCADE).
- CHECK: `fechaFin >= fechaInicio` y `horaCierre > horaApertura`.

### 2.5 — `FranjaHoraria`

- Mantener: `id`, `horaInicio`, `horaFin`, `horarioId`.
- Agregar: `fecha: Date` (NOT NULL).
- Agregar: `motivoBloqueo: string | null` (TEXT, nullable).
- Eliminar: `disponible`.
- Reemplazar con: `estadoFranjaId` (FK a `EstadoFranja`, NOT NULL).
- CHECK: `horaFin > horaInicio`.

### 2.6 — `Turno`

- Mantener: `id`, `notas`, `creadoEn`, `clienteId` (FK a `Usuario`), `franjaId` (FK a `FranjaHoraria`).
- Eliminar: `estado` (ENUM).
- Agregar: `estadoTurnoId` (FK a `EstadoTurno`, NOT NULL).
- Si en alguna iteración previa se agregó `servicioId` directamente al turno, eliminarlo (el servicio se obtiene vía `franja → horario → servicio`).

### 2.7 — `Notificacion`

- Mantener: `id`, `mensaje`, `fechaEnvio`, `leida`, `turnoId` (FK a `Turno`, NOT NULL, ON DELETE CASCADE).
- Eliminar: `tipo` (ENUM).
- Agregar: `tipoNotificacionId` (FK a `TipoNotificacion`, NOT NULL).

---

## Fase 3 — Relaciones bidireccionales

Configurar las relaciones del ORM correctamente:

| Relación | Tipo | Notas |
|----------|------|-------|
| `Rol` ↔ `Usuario` | OneToMany / ManyToOne | |
| `Usuario` ↔ `Servicio` (profesional) | OneToMany / ManyToOne | nombre de la prop: `profesional` |
| `Usuario` ↔ `Turno` (cliente) | OneToMany / ManyToOne | nombre de la prop: `cliente` |
| `Servicio` ↔ `Horario` | OneToMany / ManyToOne | CASCADE en delete |
| `Horario` ↔ `FranjaHoraria` | OneToMany / ManyToOne | CASCADE en delete |
| `EstadoFranja` ↔ `FranjaHoraria` | OneToMany / ManyToOne | RESTRICT en delete |
| `FranjaHoraria` ↔ `Turno` | OneToMany / ManyToOne | |
| `EstadoTurno` ↔ `Turno` | OneToMany / ManyToOne | RESTRICT en delete |
| `Turno` ↔ `Notificacion` | OneToMany / ManyToOne | CASCADE en delete |
| `TipoNotificacion` ↔ `Notificacion` | OneToMany / ManyToOne | RESTRICT en delete |

---

## Fase 4 — Seeds de catálogos

Crear (o actualizar) un script de seed que se ejecute al iniciar la app o vía comando manual. Debe poblar:

```
roles:
  - "Cliente" (descripción: "Usuario que reserva turnos")
  - "Profesional" (descripción: "Usuario que ofrece servicios")

estados_franja:
  - "Libre"
  - "Ocupada"
  - "Bloqueada"

estados_turno:
  - "Pendiente"
  - "Confirmado"
  - "Cancelado"
  - "Completado"
  - "No asistió"

tipos_notificacion:
  - "Recordatorio"
  - "Confirmación"
  - "Cancelación"
  - "Reprogramación"
```

**Importante:** el seed debe ser **idempotente** (verificar si ya existe antes de insertar) para que se pueda correr múltiples veces sin duplicar.

Ubicación sugerida: `src/seeds/catalogs.ts` o similar, según las convenciones del proyecto.

---

## Fase 5 — Constantes y helpers

Crear un archivo `src/constants/catalog.ts` (o equivalente) con los nombres como constantes para evitar strings mágicos en el código:

```typescript
export const ROL = {
  CLIENTE: 'Cliente',
  PROFESIONAL: 'Profesional',
} as const;

export const ESTADO_FRANJA = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  BLOQUEADA: 'Bloqueada',
} as const;

export const ESTADO_TURNO = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  COMPLETADO: 'Completado',
  NO_ASISTIO: 'No asistió',
} as const;

export const TIPO_NOTIFICACION = {
  RECORDATORIO: 'Recordatorio',
  CONFIRMACION: 'Confirmación',
  CANCELACION: 'Cancelación',
  REPROGRAMACION: 'Reprogramación',
} as const;
```

Crear repositorios o helpers para obtener los IDs por nombre, ya que las FKs son por ID:

```typescript
// src/repositories/catalogRepository.ts (ejemplo)
export async function getEstadoFranjaIdByNombre(nombre: string): Promise<string> { ... }
export async function getEstadoTurnoIdByNombre(nombre: string): Promise<string> { ... }
export async function getTipoNotificacionIdByNombre(nombre: string): Promise<string> { ... }
```

Recomendación: cachearlos en memoria al iniciar la app (los catálogos no cambian).

---

## Fase 6 — Lógica de negocio a actualizar

### 6.1 — Crear horario (genera franjas automáticamente)

Endpoint sugerido: `POST /horarios`

Body:
```json
{
  "servicioId": "uuid",
  "fechaInicio": "2026-05-01",
  "fechaFin": "2026-05-31",
  "horaApertura": "09:00:00",
  "horaCierre": "18:00:00"
}
```

Lógica:

```typescript
async function crearHorario(data) {
  const servicio = await servicioRepo.findById(data.servicioId);
  if (!servicio) throw new Error('Servicio no encontrado');

  const duracion = servicio.duracionMinutos;
  const estadoLibreId = await getEstadoFranjaIdByNombre(ESTADO_FRANJA.LIBRE);

  // Transacción
  await dataSource.transaction(async (manager) => {
    const horario = await manager.save(Horario, {
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      horaApertura: data.horaApertura,
      horaCierre: data.horaCierre,
      servicioId: data.servicioId,
    });

    const franjas = [];
    for (let fecha = new Date(data.fechaInicio); fecha <= new Date(data.fechaFin); fecha.setDate(fecha.getDate() + 1)) {
      let horaActual = parseTime(data.horaApertura);
      const horaCierre = parseTime(data.horaCierre);

      while (sumarMinutos(horaActual, duracion) <= horaCierre) {
        franjas.push({
          fecha: new Date(fecha),
          horaInicio: formatTime(horaActual),
          horaFin: formatTime(sumarMinutos(horaActual, duracion)),
          horarioId: horario.id,
          estadoFranjaId: estadoLibreId,
        });
        horaActual = sumarMinutos(horaActual, duracion);
      }
    }

    await manager.insert(FranjaHoraria, franjas);
  });
}
```

### 6.2 — Crear turno

Endpoint: `POST /turnos`

Body:
```json
{
  "clienteId": "uuid",
  "franjaId": "uuid",
  "notas": "..."
}
```

Lógica:

```typescript
async function crearTurno(data) {
  const estadoLibreId = await getEstadoFranjaIdByNombre(ESTADO_FRANJA.LIBRE);
  const estadoOcupadaId = await getEstadoFranjaIdByNombre(ESTADO_FRANJA.OCUPADA);
  const estadoPendienteId = await getEstadoTurnoIdByNombre(ESTADO_TURNO.PENDIENTE);
  const tipoConfirmacionId = await getTipoNotificacionIdByNombre(TIPO_NOTIFICACION.CONFIRMACION);

  await dataSource.transaction(async (manager) => {
    // Lock pesimista para evitar doble reserva
    const franja = await manager.findOne(FranjaHoraria, {
      where: { id: data.franjaId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!franja) throw new Error('Franja no encontrada');
    if (franja.estadoFranjaId !== estadoLibreId) {
      throw new Error('Franja no disponible');
    }

    const turno = await manager.save(Turno, {
      clienteId: data.clienteId,
      franjaId: data.franjaId,
      notas: data.notas,
      estadoTurnoId: estadoPendienteId,
    });

    franja.estadoFranjaId = estadoOcupadaId;
    await manager.save(franja);

    await manager.save(Notificacion, {
      mensaje: 'Tu turno fue creado correctamente',
      turnoId: turno.id,
      tipoNotificacionId: tipoConfirmacionId,
      leida: 0,
    });
  });
}
```

### 6.3 — Cancelar turno

Endpoint: `PATCH /turnos/:id/cancelar`

```typescript
async function cancelarTurno(turnoId) {
  const estadoCanceladoId = await getEstadoTurnoIdByNombre(ESTADO_TURNO.CANCELADO);
  const estadoLibreId = await getEstadoFranjaIdByNombre(ESTADO_FRANJA.LIBRE);
  const tipoCancelacionId = await getTipoNotificacionIdByNombre(TIPO_NOTIFICACION.CANCELACION);

  await dataSource.transaction(async (manager) => {
    const turno = await manager.findOne(Turno, { where: { id: turnoId } });
    if (!turno) throw new Error('Turno no encontrado');

    turno.estadoTurnoId = estadoCanceladoId;
    await manager.save(turno);

    const franja = await manager.findOne(FranjaHoraria, { where: { id: turno.franjaId } });
    franja.estadoFranjaId = estadoLibreId;
    await manager.save(franja);

    await manager.save(Notificacion, {
      mensaje: 'Tu turno fue cancelado',
      turnoId: turno.id,
      tipoNotificacionId: tipoCancelacionId,
      leida: 0,
    });
  });
}
```

### 6.4 — Bloquear franja manualmente

Endpoint: `PATCH /franjas/:id/bloquear`

```typescript
async function bloquearFranja(franjaId, motivo) {
  const estadoBloqueadaId = await getEstadoFranjaIdByNombre(ESTADO_FRANJA.BLOQUEADA);
  const estadoLibreId = await getEstadoFranjaIdByNombre(ESTADO_FRANJA.LIBRE);

  const franja = await franjaRepo.findById(franjaId);
  if (!franja) throw new Error('Franja no encontrada');
  if (franja.estadoFranjaId !== estadoLibreId) {
    throw new Error('Solo se pueden bloquear franjas libres');
  }

  franja.estadoFranjaId = estadoBloqueadaId;
  franja.motivoBloqueo = motivo;
  await franjaRepo.save(franja);
}
```

### 6.5 — Consultar disponibilidad

Endpoint: `GET /franjas?servicioId=X&fecha=Y` (devuelve solo franjas en estado Libre).

---

## Fase 7 — DTOs y validación

Actualizar (o crear) los DTOs de entrada de cada endpoint usando `class-validator` o el sistema de validación del proyecto:

- `CrearHorarioDto`: `servicioId`, `fechaInicio`, `fechaFin`, `horaApertura`, `horaCierre`.
- `CrearTurnoDto`: `clienteId`, `franjaId`, `notas?`.
- `BloquearFranjaDto`: `motivo`.

---

## Fase 8 — Tests

Si el proyecto tiene tests, actualizar los que fallen por los cambios:

- Tests de creación de horario → verificar que se generen las franjas correctas.
- Tests de creación de turno → verificar transacción y cambio de estado de franja.
- Tests de cancelación → verificar liberación de franja.
- Tests de bloqueo → verificar que no se pueda bloquear si hay turno.

Si no hay tests, recomendar crear al menos uno por cada caso de uso crítico.

---

## Fase 9 — Validaciones finales

Después de aplicar todo, **correr y verificar:**

1. **Build sin errores:** `npm run build` o equivalente.
2. **Aplicación arranca:** `npm run dev` y la conexión a DB se establece.
3. **Seeds corridos:** los catálogos están poblados.
4. **Endpoints funcionan:** probar manualmente o con tests:
   - Crear servicio.
   - Crear horario y verificar que se generen las franjas.
   - Crear turno y verificar cambio de estado de franja.
   - Cancelar turno y verificar liberación.
   - Bloquear franja manualmente.

5. **Reportar al usuario** qué quedó hecho y qué pruebas pasaron.

---

## Convenciones a respetar

- **No inventar** campos o tablas que no estén en este documento.
- **No agregar** features extra (autenticación, paginación, filtros) salvo que ya existan en el código.
- **Respetar** las convenciones de naming del proyecto existente (si usa `camelCase` o `snake_case` en columnas, mantenerlo).
- **No borrar** código que no esté relacionado al refactor.
- **Pedir confirmación** antes de cualquier acción destructiva (DROP de tablas, borrar archivos).

---

## Resumen de archivos a crear / modificar

**Crear:**
- `src/entities/EstadoFranja.ts`
- `src/entities/EstadoTurno.ts`
- `src/entities/TipoNotificacion.ts`
- `src/seeds/catalogs.ts`
- `src/constants/catalog.ts`
- `src/repositories/catalogRepository.ts`
- Migraciones nuevas (si aplica).

**Modificar:**
- `src/entities/Usuario.ts` (UNIQUE en email)
- `src/entities/Servicio.ts` (renombrar duracion)
- `src/entities/Horario.ts` (cambio estructural completo)
- `src/entities/FranjaHoraria.ts` (cambio estructural completo)
- `src/entities/Turno.ts` (estado → FK)
- `src/entities/Notificacion.ts` (tipo → FK)
- Servicios / controladores afectados (crear horario, crear turno, cancelar, bloquear).
- DTOs de los endpoints anteriores.
- Tests existentes.

**Eliminar:**
- Cualquier archivo de migración viejo si se decide empezar limpio (con confirmación).
- Cualquier código que use los ENUMs viejos.

---

## Antes de empezar

Reportar al usuario:
1. Qué encontraste en la inspección (Fase 0).
2. Plan concreto de archivos a crear/modificar.
3. Pedir confirmación.

Después de terminar:
1. Resumen de cambios aplicados.
2. Lista de validaciones que pasaron.
3. Cualquier ambigüedad encontrada o decisión que debió tomar.
