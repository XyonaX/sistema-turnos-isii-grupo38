import api from './api';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    rol?: string;
  };
}

export const authService = {
  async login(email: string, password: string): Promise<string> {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    if (response.data.user) {
      localStorage.setItem('user_nombre', response.data.user.nombre);
      localStorage.setItem('user_email', response.data.user.email);
      localStorage.setItem('user_rol', response.data.user.rol || 'usuario');
    }
    return token;
  },

  async register(nombre: string, email: string, password: string): Promise<string> {
    const response = await api.post<LoginResponse>('/auth/register', { nombre, email, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    if (response.data.user) {
      localStorage.setItem('user_nombre', response.data.user.nombre);
      localStorage.setItem('user_email', response.data.user.email);
      localStorage.setItem('user_rol', response.data.user.rol || 'usuario');
    }
    return token;
  },

  logout(): void {
    try {
      api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user_nombre');
      localStorage.removeItem('user_rol');
      localStorage.removeItem('user_email');
    }
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
};