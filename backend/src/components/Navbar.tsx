'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '../context/AuthContext';

import { ThemeToggle } from './ThemeToggle';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="12" y2="16" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function IconLogin() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function IconUserPlus() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nombre: string): string {
  return nombre
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function RoleBadge({ rol }: { rol: string }) {
  if (rol === 'admin') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 leading-none">
        admin
      </span>
    );
  }
  if (rol === 'profesional') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 leading-none">
        profesional
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-[var(--primary)] border border-teal-200 leading-none">
      cliente
    </span>
  );
}

function UserAvatar({ nombre, size = 'md' }: { nombre: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass =
    size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div
      className={`${sizeClass} rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-semibold shrink-0 select-none`}
      aria-hidden="true"
    >
      {getInitials(nombre) || '?'}
    </div>
  );
}

// ─── Link list per role ───────────────────────────────────────────────────────

function getNavLinks(rol: string | undefined): NavLink[] {
  if (rol === 'admin') {
    return [
      { href: '/admin/turnos', label: 'Turnos Admin', icon: <IconClipboard /> },
      { href: '/admin', label: 'Panel Admin', icon: <IconGrid /> },
    ];
  }
  if (rol === 'profesional') {
    return [
      { href: '/profesional/dashboard', label: 'Dashboard', icon: <IconGrid /> },
      { href: '/profesional/servicios', label: 'Mis Servicios', icon: <IconClipboard /> },
      { href: '/profesional/horarios', label: 'Disponibilidad', icon: <IconClock /> },
      { href: '/profesional/turnos', label: 'Mis Turnos', icon: <IconCalendar /> },
    ];
  }
  if (rol === 'cliente') {
    return [
      { href: '/reservar', label: 'Reservar turno', icon: <IconCalendar /> },
      { href: '/mis-turnos', label: 'Mis Turnos', icon: <IconClipboard /> },
    ];
  }
  return [];
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) return null;

  const navLinks = getNavLinks(user?.rol);
  const userName = user?.nombre ?? '';
  const userEmail = user?.email ?? '';
  const userRol = user?.rol ?? 'cliente';

  function handleLogout() {
    logout();
    setMenuOpen(false);
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  }

  return (
    <>
      <nav
        className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--surface)]"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 font-bold text-lg text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <IconHome />
              TurnoFácil
            </Link>

            {/* Desktop center nav links */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
                    ${
                      isActive(link.href)
                        ? 'bg-[var(--primary)] text-white shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <ThemeToggle />

              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  {/* User card */}
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
                    <UserAvatar nombre={userName} size="sm" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs font-semibold text-[var(--text-primary)] max-w-[120px] truncate">
                        {userName}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] max-w-[120px] truncate">
                        {userEmail}
                      </span>
                    </div>
                    <RoleBadge rol={userRol} />
                  </div>
                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <IconLogout />
                    Salir
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  >
                    <IconLogin />
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] shadow-sm"
                  >
                    <IconUserPlus />
                    Registrarse
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile right: ThemeToggle + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menuOpen}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                {menuOpen ? (
                  /* X icon */
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  /* Hamburger icon */
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
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
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[300px] max-w-[85vw] bg-[var(--surface)] border-l border-[var(--border)] flex flex-col transition-transform duration-300 ease-in-out md:hidden`}
        style={{
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: 'var(--shadow-lg)',
        }}
        aria-hidden={!menuOpen}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="font-bold text-base text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            TurnoFácil
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* User info (authenticated) */}
        {isAuthenticated && user && (
          <div className="px-4 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-3">
              <UserAvatar nombre={userName} size="lg" />
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {userName}
                </span>
                <span className="text-xs text-[var(--text-muted)] truncate">{userEmail}</span>
                <RoleBadge rol={userRol} />
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="flex flex-col gap-1">
            {isAuthenticated ? (
              navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
                      ${
                        isActive(link.href)
                          ? 'bg-[var(--primary)] text-white border-l-4 border-[var(--primary-dark)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] border-l-4 border-transparent'
                      }`}
                  >
                    <span className="shrink-0">{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] border-l-4 border-transparent transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  >
                    <IconLogin />
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-medium text-[var(--primary)] hover:bg-teal-50 border-l-4 border-transparent transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  >
                    <IconUserPlus />
                    Registrarse
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Drawer footer */}
        {isAuthenticated && (
          <div className="px-3 py-4 border-t border-[var(--border)]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 min-h-[44px] rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <IconLogout />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </>
  );
}
