'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Navbar } from '../../components/Navbar';
import { TurnoCard } from '../../components/TurnoCard';
import { useAuth } from '../../context/AuthContext';
import { turnoService } from '../../services/turnoService';
import type { Turno } from '../../types';

export default function MisTurnosPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user?.rol?.toLowerCase() === 'profesional') {
      router.replace('/profesional/dashboard');
      return;
    }

    if (user?.rol?.toLowerCase() === 'admin') {
      router.replace('/admin');
      return;
    }

    cargarTurnos();
  }, [isLoading, isAuthenticated, user]);

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await turnoService.getMisTurnos();
      setTurnos(data);
    } catch (err) {
      setError('No se pudieron cargar tus turnos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id: string) => {
    try {
      setError(null);
      setSuccess(null);
      await turnoService.cancelar(id);
      setTurnos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, estadoTurno: { id: '', nombre: 'Cancelado' } } : t))
      );
      setSuccess('Turno cancelado correctamente');
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.message || 'No se pudo cancelar el turno. Intenta de nuevo.');
      console.error(err);
    }
  };

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  if (user?.rol?.toLowerCase() === 'profesional') return null;
  if (user?.rol?.toLowerCase() === 'admin') return null;

  const turnosActivos = turnos.filter((t) => t.estadoTurno?.nombre !== 'Cancelado');
  const turnosCancelados = turnos.filter((t) => t.estadoTurno?.nombre === 'Cancelado');

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 px-4 py-12 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Mis turnos</h1>
          <p className="text-[var(--text-muted)]">
            {turnosActivos.length === 0
              ? 'No tenés turnos reservados'
              : `Tenés ${turnosActivos.length} turno${turnosActivos.length !== 1 ? 's' : ''} próximo${turnosActivos.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-sm font-medium">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin mb-4">
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
            <p className="text-[var(--text-muted)]">Cargando turnos...</p>
          </div>
        ) : turnos.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <svg
              className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Sin turnos reservados
            </h3>
            <p className="text-[var(--text-muted)] mb-4">
              Todavía no tenés turnos. Buscá un horario disponible y hacé tu primera reserva.
            </p>
            <button
              onClick={() => router.push('/reservar')}
              className="cursor-pointer inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
            >
              Ver horarios disponibles
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {turnosActivos.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Turnos próximos
                </h2>
                <div className="space-y-4">
                  {turnosActivos.map((turno) => (
                    <TurnoCard key={turno.id} turno={turno} onCancelar={handleCancelar} />
                  ))}
                </div>
              </div>
            )}

            {turnosCancelados.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Turnos cancelados
                </h2>
                <div className="space-y-4 opacity-60">
                  {turnosCancelados.map((turno) => (
                    <TurnoCard key={turno.id} turno={turno} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
