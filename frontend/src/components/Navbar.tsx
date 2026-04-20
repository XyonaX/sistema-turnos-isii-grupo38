'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  // Mostrar solo "Inicio" en rutas de login/register
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdmin = user?.rol === 'admin';

  const handleLogout = () => {
    authService.logout();
    router.push('/');
  };

  // Si estamos en una página de autenticación, mostrar navbar simplificado
  if (isAuthPage) {
    return (
      <nav className="bg-slate-900 text-white p-4 flex gap-6 items-center">
        <Link href="/" className="hover:text-blue-400 transition">Inicio</Link>
      </nav>
    );
  }

  return (
    <nav className="bg-slate-900 text-white p-4 flex gap-6 items-center">
      {/* Mostrar links según el tipo de usuario */}
      {isAuthenticated && isAdmin && (
        <Link href="/disponibilidad" className="hover:text-blue-400 transition">Disponibilidad</Link>
      )}
      {isAuthenticated && !isAdmin && (
        <>
          <Link href="/mis-turnos" className="hover:text-blue-400 transition">Mis turnos</Link>
          <Link href="/disponibilidad" className="hover:text-blue-400 transition">Disponibilidad</Link>
        </>
      )}
      {!isAuthenticated && (
        <>
          <Link href="/" className="hover:text-blue-400 transition">Inicio</Link>
          <Link href="/disponibilidad" className="hover:text-blue-400 transition">Disponibilidad</Link>
        </>
      )}

      <div className="ml-auto flex gap-3">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
          >
            Cerrar sesión
          </button>
        ) : (
          <>
            <Link href="/login" className="px-4 py-2 border border-white/30 rounded hover:bg-white/10 transition">
              Iniciar sesión
            </Link>
            <Link href="/register" className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded transition">
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}