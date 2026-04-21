import type { Turno, FranjaHoraria } from '../types';

import api from './api';

export const turnoService = {
  async getDisponibles(): Promise<FranjaHoraria[]> {
    const { data } = await api.get<FranjaHoraria[]>('/horarios');
    return data;
  },

  async reservar(franjaId: string, notas?: string): Promise<Turno> {
    const { data } = await api.post<Turno>('/turnos', { franjaId, notas });
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
