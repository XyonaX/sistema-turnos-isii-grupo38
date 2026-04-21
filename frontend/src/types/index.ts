export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'cliente' | 'profesional' | 'admin';
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion: number;
  precio?: number;
  profesional?: {
    id: string;
    nombre: string;
    email?: string;
  };
}

export interface FranjaHoraria {
  id: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  horario?: {
    id: string;
    fecha: string;
    lapsoMinutos: number;
    servicio?: Servicio;
  };
  turno?: {
    id: string;
    estado: EstadoTurno;
    notas?: string;
    cliente?: {
      id: string;
      nombre: string;
      email: string;
    };
  };
}

export type EstadoTurno = 'pendiente' | 'confirmado' | 'cancelado' | 'completado';

export interface Turno {
  id: string;
  cliente: Usuario;
  franja?: FranjaHoraria | null; // null for cancelled turnos (FK is freed on cancellation)
  estado: EstadoTurno;
  notas?: string;
  creadoEn: string | Date;
}

export interface AuthResponse {
  token: string;
}

/**
 * @deprecated Use FranjaHoraria instead.
 * Kept for backward-compatibility with legacy admin pages.
 */
export interface Horario {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}
