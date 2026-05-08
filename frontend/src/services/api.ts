import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      console.error('Error de red - El backend puede no estar disponible:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    }
    return Promise.reject(error);
  }
);

export default api;
