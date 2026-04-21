import type { FranjaHoraria } from '../types';

import api from './api';

interface CrearHorarioParams {
  servicioId: string;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  lapsoMinutos: number;
}

export const horarioService = {
  async crear(params: CrearHorarioParams): Promise<FranjaHoraria[]> {
    const res = await api.post('/horarios', params);
    return res.data;
  },

  async getDisponibles(): Promise<FranjaHoraria[]> {
    const res = await api.get('/horarios');
    return res.data;
  },

  async toggleDisponibilidad(id: string): Promise<FranjaHoraria> {
    const res = await api.patch(`/horarios/${id}/toggle`);
    return res.data;
  },

  async cancelar(id: string): Promise<void> {
    await api.delete(`/horarios/${id}`);
  },
};
