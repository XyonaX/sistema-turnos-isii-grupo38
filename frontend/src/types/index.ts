export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'cliente' | 'admin';
}

export interface Horario {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

export type EstadoTurno = 'pendiente' | 'confirmado' | 'cancelado';

export interface Turno {
  id: string;
  cliente: Usuario;
  horario: Horario;
  estado: EstadoTurno;
  notas?: string;
  creadoEn: string;
}

export interface AuthResponse {
  token: string;
}
