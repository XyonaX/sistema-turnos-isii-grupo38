import api from './api';
import { Turno, Horario } from '../types';

export const turnoService = {
  async getDisponibles(): Promise<Horario[]> {
    const { data } = await api.get<Horario[]>('/horarios');
    return data;
  },

  async reservar(horarioId: string, notas?: string): Promise<Turno> {
    const { data } = await api.post<Turno>('/turnos', { horarioId, notas });
    return data;
  },

  async getMisTurnos(): Promise<Turno[]> {
    const { data } = await api.get<Turno[]>('/turnos/mis-turnos');
    return data;
  },

  async cancelar(turnoId: string): Promise<Turno> {
    const { data } = await api.patch<Turno>(`/turnos/${turnoId}/cancelar`);
    return data;
  },
};
