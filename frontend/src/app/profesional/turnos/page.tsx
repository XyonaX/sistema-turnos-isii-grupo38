'use client';
import { useEffect, useState } from 'react';

import { Navbar } from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import type { FranjaHoraria } from '../../../types';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type FiltroVista = 'todos' | 'disponible' | 'reservado' | 'cancelado';

function getEstadoSlot(franja: FranjaHoraria): 'disponible' | 'reservado' | 'cancelado' {
  if (franja.disponible) return 'disponible';
  if (franja.turno?.estado === 'cancelado') return 'cancelado';
  return 'reservado';
}

const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  disponible: { label: 'Disponible', className: 'bg-green-100 text-green-700 border-green-200' },
  reservado: { label: 'Reservado', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  pendiente: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmado: { label: 'Confirmado', className: 'bg-green-100 text-green-700 border-green-200' },
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-600 border-red-200' },
  completado: { label: 'Completado', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function SlotBadge({ franja }: { franja: FranjaHoraria }) {
  const key = franja.disponible ? 'disponible' : (franja.turno?.estado ?? 'reservado');
  const cfg = ESTADO_BADGE[key] ?? {
    label: key,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfesionalTurnosPage() {
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [franjas, setFranjas] = useState<FranjaHoraria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroVista>('todos');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) cargarFranjas();
  }, [mounted, isAuthenticated]);

  const cargarFranjas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/horarios/profesional');
      setFranjas(res.data || []);
    } catch (err) {
      console.error('Error cargando franjas:', err);
      setError('Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarTurno = async (franjaId: string) => {
    try {
      setCancelingId(franjaId);
      setError(null);
      setSuccess(null);
      const franja = franjas.find((f) => f.id === franjaId);
      if (!franja?.turno?.id) {
        setError('No se encontró el turno para cancelar');
        setCancelingId(null);
        return;
      }

      await api.patch(`/turnos/profesional/${franja.turno.id}/cancelar`);
      setFranjas((prev) =>
        prev.map((f) =>
          f.id === franjaId
            ? { ...f, disponible: true, turno: { ...f.turno!, estado: 'cancelado' } }
            : f
        )
      );
      setSuccess('Turno cancelado correctamente');
      setShowConfirmModal(null);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Error al cancelar el turno');
      console.error(err);
    } finally {
      setCancelingId(null);
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

  if (user?.rol !== 'Profesional') {
    return (
      <>
        <Navbar />
        <main className="flex-1 px-4 py-12 max-w-6xl mx-auto w-full">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Acceso denegado</p>
          </div>
        </main>
      </>
    );
  }

  // Contadores
  const contadores: Record<FiltroVista, number> = {
    todos: franjas.length,
    disponible: franjas.filter((f) => getEstadoSlot(f) === 'disponible').length,
    reservado: franjas.filter((f) => getEstadoSlot(f) === 'reservado').length,
    cancelado: franjas.filter((f) => getEstadoSlot(f) === 'cancelado').length,
  };

  const franjasFiltradas =
    filtro === 'todos' ? franjas : franjas.filter((f) => getEstadoSlot(f) === filtro);

  // Agrupar por fecha
  const porFecha: Record<string, FranjaHoraria[]> = {};
  for (const f of franjasFiltradas) {
    const fecha = f.horario?.fecha ?? 'sin-fecha';
    if (!porFecha[fecha]) porFecha[fecha] = [];
    porFecha[fecha].push(f);
  }
  const fechasOrdenadas = Object.keys(porFecha).sort();

  return (
    <>
      <Navbar />
      <main className="px-4 py-10 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <IconCalendar />
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Mis Turnos</h1>
          </div>
          <p className="text-[var(--text-muted)] ml-12">
            Todos los slots generados y su estado de reserva
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              { key: 'todos', label: 'Todos' },
              { key: 'disponible', label: 'Disponibles' },
              { key: 'reservado', label: 'Reservados' },
              { key: 'cancelado', label: 'Cancelados' },
            ] as { key: FiltroVista; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                filtro === key
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-75">({contadores[key]})</span>
            </button>
          ))}
        </div>

        {/* Mensajes de error y éxito */}
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

        {/* Contenido */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg
              className="animate-spin w-10 h-10 text-[var(--primary)]"
              fill="none"
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
        ) : franjasFiltradas.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--bg)] flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
              <IconCalendar />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {filtro === 'todos' ? 'Sin turnos generados' : `Sin turnos ${filtro}s`}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              {filtro === 'todos'
                ? 'Generá disponibilidad desde la sección "Disponibilidad".'
                : 'Probá con otro filtro.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {fechasOrdenadas.map((fecha) => {
              const items = porFecha[fecha];
              const fechaLabel =
                fecha !== 'sin-fecha'
                  ? new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Sin fecha';
              const servicio = items[0]?.horario?.servicio?.nombre ?? '';

              return (
                <div key={fecha}>
                  {/* Encabezado de fecha */}
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-sm font-bold text-[var(--text-primary)] capitalize">
                      {fechaLabel}
                    </p>
                    {servicio && (
                      <>
                        <span className="text-[var(--border)]">·</span>
                        <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)] px-2 py-0.5 rounded-full">
                          {servicio}
                        </span>
                      </>
                    )}
                    <span className="text-xs text-[var(--text-muted)]">
                      ({items.length} slot{items.length !== 1 ? 's' : ''})
                    </span>
                  </div>

                  {/* Grid de slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((franja) => {
                      const estado = getEstadoSlot(franja);
                      const cliente = franja.turno?.cliente;

                      return (
                        <div
                          key={franja.id}
                          className={`bg-[var(--surface)] border rounded-xl px-4 py-3 transition-shadow hover:shadow-sm ${
                            estado === 'disponible'
                              ? 'border-green-200 dark:border-green-900/40'
                              : estado === 'cancelado'
                                ? 'border-red-200 dark:border-red-900/40 opacity-60'
                                : 'border-blue-200 dark:border-blue-900/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-[var(--text-primary)]">
                              {franja.horaInicio} – {franja.horaFin}
                            </span>
                            <div className="flex items-center gap-2">
                              <SlotBadge franja={franja} />
                              {estado === 'reservado' && (
                                <button
                                  onClick={() => setShowConfirmModal(franja.id)}
                                  disabled={cancelingId === franja.id}
                                  className="px-2 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 rounded font-medium transition-all disabled:opacity-50"
                                >
                                  {cancelingId === franja.id ? '⏳' : '✕'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Cliente si está reservado */}
                          {cliente ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[var(--text-muted)]">
                                <IconUser />
                              </span>
                              <span className="text-xs text-[var(--text-secondary)] font-medium truncate">
                                {cliente.nombre}
                              </span>
                              <span className="text-xs text-[var(--text-muted)] truncate hidden sm:block">
                                · {cliente.email}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                              {estado === 'cancelado' ? 'Turno cancelado' : 'Sin reserva'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Confirmación */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Cancelar turno</h3>
              </div>

              <p className="text-[var(--text-secondary)] mb-6">
                ¿Estás seguro de que deseas cancelar este turno? El horario volverá a estar
                disponible.
              </p>

              <p className="text-sm text-[var(--text-muted)] mb-6 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                Al cancelar, el cliente será notificado de la cancelación del turno.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  disabled={cancelingId !== null}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--bg)] transition-all disabled:opacity-50"
                >
                  No cancelar
                </button>
                <button
                  onClick={() => showConfirmModal && handleCancelarTurno(showConfirmModal)}
                  disabled={cancelingId !== null}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all"
                >
                  {cancelingId ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
