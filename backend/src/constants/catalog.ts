export const ROL = {
  CLIENTE: 'cliente',
  PROFESIONAL: 'profesional',
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
