'use client';
import { useEffect, useState } from 'react';

import { Navbar } from '../../../components/Navbar';
import api from '../../../services/api';
import type { Turno } from '../../../types';

export default function AdminTurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<Turno[]>('/turnos/admin');
      setTurnos(data);
    } catch {
      setError('No se pudieron cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const cancelar = async (id: string) => {
    try {
      await api.patch(`/turnos/admin/${id}/cancelar`);
      cargar();
    } catch {
      setError('No se pudo cancelar el turno');
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmado':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'text-green-700 dark:text-green-400',
        };
      case 'pendiente':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-700 dark:text-yellow-400',
        };
      case 'cancelado':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-700 dark:text-red-400',
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-700 dark:text-gray-400',
        };
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-12 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Todos los turnos</h1>
          <p className="text-[var(--text-muted)]">
            Visualiza y administra todos los turnos del sistema
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
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
            <p className="text-[var(--text-muted)]">No hay turnos registrados en el sistema</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    Hora
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text-secondary)]">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t) => {
                  const estadoStyle = getEstadoBadge(t.estadoTurno.nombre);
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--surface)]/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm">
                        <span className="font-medium text-[var(--text-primary)]">
                          {t.franja?.fecha
                            ? new Date(t.franja.fecha + 'T00:00:00').toLocaleDateString(
                                'es-ES'
                              )
                            : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                        {t.franja?.horaInicio} — {t.franja?.horaFin}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            {t.cliente.nombre}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{t.cliente.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${estadoStyle.bg} ${estadoStyle.border} ${estadoStyle.text}`}
                        >
                          {t.estadoTurno.nombre.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {t.estadoTurno.id !== 'cancelado' && (
                          <button
                            onClick={() => cancelar(t.id)}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg transition-all"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
