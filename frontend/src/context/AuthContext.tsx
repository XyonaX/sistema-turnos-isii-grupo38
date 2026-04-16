'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';

interface AuthUser {
  nombre: string;
  email: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

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
      setUser({ nombre, email });
    }

    // Also check localStorage for stored user info (set by authService.login)
    const storedNombre = localStorage.getItem('user_nombre');
    const storedEmail = localStorage.getItem('user_email');
    if (storedNombre || storedEmail) {
      setUser({
        nombre: storedNombre ?? '',
        email: storedEmail ?? '',
      });
    }
  }, []);

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
