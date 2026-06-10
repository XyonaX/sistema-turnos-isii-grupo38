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
  duracionMinutos: number;
  precio?: number;
  profesional?: {
    id: string;
    nombre: string;
    email?: string;
  };
}

export interface FranjaHoraria {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivoBloqueo?: string;
  estadoFranja?: {
    id: string;
    nombre: string;
  };
  horario?: {
    id: string;
    fechaInicio: string;
    fechaFin: string;
    horaApertura: string;
    horaCierre: string;
    servicio?: {
      id: string;
      nombre: string;
      duracionMinutos: number;
      precio?: number;
      profesional?: {
        id: string;
        nombre: string;
        email: string;
      };
    };
  };
  turno?: {
    id: string;
    estadoTurno?: { id: string; nombre: string };
    notas?: string;
    cliente?: {
      id: string;
      nombre: string;
      email: string;
    };
  };
}

export type EstadoTurnoNombre =
  | 'Pendiente'
  | 'Confirmado'
  | 'Cancelado'
  | 'Completado'
  | 'No asistió';

export interface Turno {
  id: string;
  cliente: Usuario;
  franja?: FranjaHoraria | null;
  estadoTurno: { id: string; nombre: EstadoTurnoNombre };
  notas?: string;
  creadoEn: string | Date;
  franjaFecha?: string;
  franjaHoraInicio?: string;
  franjaHoraFin?: string;
}

export interface AuthResponse {
  token: string;
}

/** @deprecated Use FranjaHoraria instead. */
export interface Horario {
  id: string;
  horaInicio: string;
  horaFin: string;
  estadoFranja?: { id: string; nombre: string };
  horario?: {
    id?: string;
    fecha: string;
  };
}
