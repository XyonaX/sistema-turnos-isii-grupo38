'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Navbar } from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

interface DashboardStats {
  turnosTotal: number;
  turnosHoy: number;
  turnosPendientes: number;
  tarjeta: string;
}

export default function ProfesionalDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    turnosTotal: 0,
    turnosHoy: 0,
    turnosPendientes: 0,
    tarjeta: '',
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      cargarStats();
    }
  }, [mounted, isAuthenticated]);

  const cargarStats = async () => {
    try {
      setLoading(true);
      const turnosRes = await api.get('/turnos/profesional');
      const turnos = turnosRes.data || [];

      const hoy = new Date().toISOString().split('T')[0];
      const turnosHoy = turnos.filter((t: any) => t.franja?.horario?.fecha === hoy).length;
      const turnosPendientes = turnos.filter((t: any) => t.estado === 'pendiente').length;

      setStats({
        turnosTotal: turnos.length,
        turnosHoy,
        turnosPendientes,
        tarjeta: user?.nombre || 'Profesional',
      });
    } catch (err) {
      console.error('Error cargando stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <>
        <Navbar />
        <main className="flex-1 px-4 py-12 max-w-6xl mx-auto w-full">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center">
            <p className="text-yellow-600 dark:text-yellow-400 font-semibold">
              Necesitas iniciar sesión
            </p>
          </div>
        </main>
      </>
    );
  }

  if (user?.rol !== 'profesional') {
    return (
      <>
        <Navbar />
        <main className="flex-1 px-4 py-12 max-w-6xl mx-auto w-full">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Acceso denegado</p>
            <p className="text-red-600/70 dark:text-red-400/70 mt-2">
              Solo los profesionales pueden acceder a este panel
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-12 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            ¡Bienvenido, {user?.nombre}!
          </h1>
          <p className="text-[var(--text-muted)]">
            Panel de control de tu actividad profesional
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Turnos Total */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--text-muted)] text-sm font-semibold mb-1">Turnos Total</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.turnosTotal}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
              </div>
            </div>

            {/* Turnos Hoy */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--text-muted)] text-sm font-semibold mb-1">Hoy</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.turnosHoy}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
                </div>
              </div>
            </div>

            {/* Turnos Pendientes */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--text-muted)] text-sm font-semibold mb-1">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.turnosPendientes}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
              </div>
            </div>

            {/* Card */}
            <div className="bg-gradient-to-br from-violet-500 to-[var(--primary)] rounded-2xl p-6 text-white shadow-md">
              <div className="mb-8">
                <p className="text-sm opacity-90 font-semibold tracking-wide">PROFESIONAL</p>
              </div>
              <div className="text-lg font-bold mb-6">{stats.tarjeta}</div>
              <div className="flex items-center justify-between text-xs opacity-75">
                <span>ID: {user?.id?.substring(0, 8)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/profesional/servicios')}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-left hover:border-blue-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3 group-hover:bg-blue-500/20 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <h3 className="font-bold text-[var(--text-primary)] mb-1">Mis Servicios</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Gestioná los servicios que ofrecés
            </p>
          </button>

          <button
            onClick={() => router.push('/profesional/horarios')}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-left hover:border-green-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 mb-3 group-hover:bg-green-500/20 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h3 className="font-bold text-[var(--text-primary)] mb-1">Mi Disponibilidad</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Configurá tus horarios disponibles
            </p>
          </button>

          <button
            onClick={() => router.push('/profesional/turnos')}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-left hover:border-violet-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-3 group-hover:bg-violet-500/20 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>
            </div>
            <h3 className="font-bold text-[var(--text-primary)] mb-1">Mis Turnos</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Revisá y gestioná tus turnos
            </p>
          </button>
        </div>
      </main>
    </>
  );
}
