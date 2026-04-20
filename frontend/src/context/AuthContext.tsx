'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';

interface AuthUser {
  nombre: string;
  email: string;
  rol?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: () => {},
});

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  // Función para actualizar el estado basado en localStorage
  const updateAuthState = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    setIsAuthenticated(true);

    const payload = decodeJwtPayload(token);
    if (payload) {
      const nombre =
        typeof payload['nombre'] === 'string'
          ? payload['nombre']
          : typeof payload['name'] === 'string'
            ? payload['name']
            : '';
      const email =
        typeof payload['email'] === 'string' ? payload['email'] : '';
      const rol =
        typeof payload['rol'] === 'string' ? payload['rol'] : 'usuario';
      setUser({ nombre, email, rol });
    } else {
      // Si el token no es válido, limpiar
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    // Actualizar estado inicial
    updateAuthState();
    setMounted(true);

    // Escuchar cambios de localStorage (de otra pestaña)
    const handleStorageChange = () => {
      updateAuthState();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setIsAuthenticated(true);
    
    // Decodificar el token y extraer el usuario
    const token = localStorage.getItem('token');
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload) {
        const nombre =
          typeof payload['nombre'] === 'string'
            ? payload['nombre']
            : typeof payload['name'] === 'string'
              ? payload['name']
              : '';
        const userEmail =
          typeof payload['email'] === 'string' ? payload['email'] : '';
        const rol =
          typeof payload['rol'] === 'string' ? payload['rol'] : 'usuario';
        setUser({ nombre, email: userEmail, rol });
      }
    }
  };

  const logout = () => {
    authService.logout();
    // Actualizar el estado inmediatamente
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}