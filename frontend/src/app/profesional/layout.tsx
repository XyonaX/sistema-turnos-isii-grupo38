'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';

export default function ProfesionalLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const token = localStorage.getItem('token');

    if (!token || !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user && user.rol !== 'Profesional') {  // ← mayúscula
      router.replace('/');
    }
  }, [isAuthenticated, user, router, isLoading]);

  if (isLoading) return null;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token || !isAuthenticated || (user && user.rol !== 'Profesional')) {  // ← mayúscula
    return null;
  }

  return <>{children}</>;
}