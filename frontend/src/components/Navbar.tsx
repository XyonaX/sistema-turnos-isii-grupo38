'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '../context/AuthContext';

import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/login');
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[var(--border)]"
      style={{ backgroundColor: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <nav
        className="mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8"
        style={{ maxWidth: '1280px' }}
        aria-label="Navegacion principal"
      >
        {/* Brand */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight shrink-0 text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-150"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          TurnoFacil
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                href="/disponibilidad"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-150"
              >
                Disponibilidad
              </Link>
              <Link
                href="/mis-turnos"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-150"
              >
                Mis turnos
              </Link>
              {user?.nombre && (
                <span className="text-sm font-medium text-[var(--text-muted)]">{user.nombre}</span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-semibold px-4 py-1.5 rounded-lg text-white transition-opacity duration-150 hover:opacity-90 cursor-pointer border-0"
                style={{ background: 'var(--gradient-cta)', boxShadow: 'var(--shadow-sm)' }}
              >
                Cerrar sesion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-150"
              >
                Iniciar sesion
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold px-4 py-1.5 rounded-lg text-white transition-opacity duration-150 hover:opacity-90"
                style={{ background: 'var(--gradient-cta)', boxShadow: 'var(--shadow-sm)' }}
              >
                Registrarse
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          <ThemeToggle />
          <button
            aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((p) => !p)}
            className="p-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-150 border-0 bg-transparent cursor-pointer"
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="sm:hidden flex flex-col gap-1 px-4 pb-4 pt-2 border-t border-[var(--border)]"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          {isAuthenticated ? (
            <>
              <Link
                href="/disponibilidad"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] px-2 py-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-all duration-150"
                onClick={() => setMenuOpen(false)}
              >
                Disponibilidad
              </Link>
              <Link
                href="/mis-turnos"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] px-2 py-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-all duration-150"
                onClick={() => setMenuOpen(false)}
              >
                Mis turnos
              </Link>
              {user?.nombre && (
                <span className="text-sm text-[var(--text-muted)] px-2 py-1">{user.nombre}</span>
              )}
              <button
                onClick={handleLogout}
                className="mt-1 text-sm font-semibold px-4 py-2.5 rounded-lg text-white text-center transition-opacity duration-150 hover:opacity-90 cursor-pointer border-0 w-full"
                style={{ background: 'var(--gradient-cta)' }}
              >
                Cerrar sesion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] px-2 py-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-all duration-150"
                onClick={() => setMenuOpen(false)}
              >
                Iniciar sesion
              </Link>
              <Link
                href="/register"
                className="mt-1 text-sm font-semibold px-4 py-2.5 rounded-lg text-white text-center transition-opacity duration-150 hover:opacity-90 block"
                style={{ background: 'var(--gradient-cta)' }}
                onClick={() => setMenuOpen(false)}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
