import type { AuthResponse, Usuario } from '../types';
import api from './api';

export const authService = {
  async register(nombre: string, email: string, password: string): Promise<Usuario> {
    const { data } = await api.post<Usuario>('/auth/register', { nombre, email, password });
    return data;
  },

  async login(email: string, password: string): Promise<string> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('token', data.token);

    // Decodificar el JWT payload y almacenar información del usuario para AuthContext
    try {
      const parts = data.token.split('.');
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
        const nombre =
          typeof payload['nombre'] === 'string'
            ? payload['nombre']
            : typeof payload['name'] === 'string'
              ? payload['name']
              : email;
        const userEmail = typeof payload['email'] === 'string' ? payload['email'] : email;
        localStorage.setItem('user_nombre', nombre);
        localStorage.setItem('user_email', userEmail);
      }
    } catch {
      // si la decodificación falla, almacenar email como fallback
      localStorage.setItem('user_nombre', email);
      localStorage.setItem('user_email', email);
    }

    return data.token;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_nombre');
    localStorage.removeItem('user_email');
  },
};
