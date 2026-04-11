import api from './api';
import { AuthResponse, Usuario } from '../types';

export const authService = {
  async register(nombre: string, email: string, password: string): Promise<Usuario> {
    const { data } = await api.post<Usuario>('/auth/register', { nombre, email, password });
    return data;
  },

  async login(email: string, password: string): Promise<string> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    return data.token;
  },

  logout() {
    localStorage.removeItem('token');
  },
};
