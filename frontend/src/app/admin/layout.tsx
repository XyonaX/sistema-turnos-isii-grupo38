'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Esperar a que el contexto esté montado (token en localStorage)
    const token = localStorage.getItem('token');

    if (!token || !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user && user.rol !== 'admin') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  // Mientras se verifica, no renderizar nada para evitar flash de contenido
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token || !isAuthenticated || (user && user.rol !== 'admin')) {
    return null;
  }

  return <>{children}</>;
}
