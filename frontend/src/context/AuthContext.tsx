'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { authService } from '../services/authService';

interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
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

function getUserFromToken(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    id: typeof payload['id'] === 'string' ? payload['id'] : '',
    nombre:
      typeof payload['nombre'] === 'string'
        ? payload['nombre']
        : typeof payload['name'] === 'string'
          ? payload['name']
          : '',
    email: typeof payload['email'] === 'string' ? payload['email'] : '',
    rol: typeof payload['rol'] === 'string' ? payload['rol'].toLowerCase() : 'cliente',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Iniciar siempre en false/null para evitar hydration mismatch
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Leer localStorage solo en el cliente
    const token = localStorage.getItem('token');
    if (token) {
      const userData = getUserFromToken(token);
      if (userData) {
        setIsAuthenticated(true);
        setUser(userData);
      }
    }
    setIsLoading(false);

    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
      } else {
        setIsAuthenticated(true);
        setUser(getUserFromToken(token));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
    const token = localStorage.getItem('token');
    if (token) {
      const userData = getUserFromToken(token);
      setIsAuthenticated(true);
      setUser(userData);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
