import type { Servicio } from '../types';

import api from './api';

interface CrearServicioParams {
  nombre: string;
  descripcion: string;
  duracion: number;
  precio: number;
}

export const servicioService = {
  async getMisServicios(): Promise<Servicio[]> {
    const res = await api.get('/servicios');
    return res.data;
  },

  async crearServicio(data: CrearServicioParams): Promise<Servicio> {
    const res = await api.post('/servicios', data);
    return res.data;
  },

  async actualizarServicio(id: string, data: Partial<Servicio>): Promise<Servicio> {
    const res = await api.patch(`/servicios/${id}`, data);
    return res.data;
  },

  async eliminarServicio(id: string): Promise<void> {
    await api.delete(`/servicios/${id}`);
  },
};
