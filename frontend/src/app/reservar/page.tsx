'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import type { FranjaHoraria, Servicio } from '../../types';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg
      width="14"
      height="14"
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
function IconCalendar() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFechaLarga(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatFechaCorta(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00');
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

// ─── Modal de confirmación ────────────────────────────────────────────────────

interface ModalProps {
  franja: FranjaHoraria;
  onConfirm: (notas: string) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

function ModalConfirmar({ franja, onConfirm, onClose, loading }: ModalProps) {
  const [notas, setNotas] = useState('');
  const servicio = franja.horario?.servicio;
  const fecha = franja.horario?.fecha ?? '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Confirmar reserva</h2>
        <p className="text-sm text-[var(--text-muted)] mb-5">
          Revisá los detalles antes de confirmar
        </p>

        {/* Detalle del turno */}
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--text-muted)]">
              <IconCalendar />
            </span>
            <span className="text-[var(--text-primary)] font-medium capitalize">
              {formatFechaLarga(fecha)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--text-muted)]">
              <IconClock />
            </span>
            <span className="text-[var(--text-primary)] font-medium">
              {franja.horaInicio} – {franja.horaFin}
            </span>
          </div>
          {servicio && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--text-muted)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </span>
                <span className="text-[var(--text-primary)] font-medium">{servicio.nombre}</span>
                <span className="text-xs text-[var(--text-muted)]">· {servicio.duracion} min</span>
              </div>
              {servicio.profesional && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--text-muted)]">
                    <IconUser />
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    {servicio.profesional.nombre}
                  </span>
                </div>
              )}
              {servicio.precio !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--text-muted)]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    ${Number(servicio.precio).toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Notas opcionales */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
            Notas (opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Información adicional para el profesional..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-xl hover:bg-[var(--bg)] transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(notas)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] disabled:bg-gray-400 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
                Reservando...
              </>
            ) : (
              <>
                <IconCheck />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ReservarPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Datos
  const [franjas, setFranjas] = useState<FranjaHoraria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>('todos');

  // Reserva
  const [franjaModal, setFranjaModal] = useState<FranjaHoraria | null>(null);
  const [reservando, setReservando] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.rol === 'profesional') {
      router.replace('/profesional/dashboard');
      return;
    }
    if (user?.rol === 'admin') {
      router.replace('/admin');
      return;
    }
    cargarFranjas();
  }, [mounted, isAuthenticated, user, router]);

  const cargarFranjas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/horarios');
      setFranjas(res.data || []);
    } catch {
      setError('No se pudieron cargar los turnos disponibles');
    } finally {
      setLoading(false);
    }
  };

  // Extraer servicios únicos de las franjas
  const servicios: Servicio[] = useMemo(() => {
    const mapa = new Map<string, Servicio>();
    for (const f of franjas) {
      const s = f.horario?.servicio;
      if (s && !mapa.has(s.id)) mapa.set(s.id, s);
    }
    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [franjas]);

  // Filtrar franjas según servicio y búsqueda
  const franjasFiltradas = useMemo(() => {
    return franjas.filter((f) => {
      const s = f.horario?.servicio;
      if (!s) return false;
      if (servicioSeleccionado !== 'todos' && s.id !== servicioSeleccionado) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        if (!s.nombre.toLowerCase().includes(q) && !s.profesional?.nombre.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [franjas, servicioSeleccionado, busqueda]);

  // Agrupar por fecha
  const porFecha = useMemo(() => {
    const mapa: Record<string, FranjaHoraria[]> = {};
    for (const f of franjasFiltradas) {
      const fecha = f.horario?.fecha ?? '';
      if (!mapa[fecha]) mapa[fecha] = [];
      mapa[fecha].push(f);
    }
    return mapa;
  }, [franjasFiltradas]);

  const fechasOrdenadas = Object.keys(porFecha).sort();

  const handleReservar = async (notas: string) => {
    if (!franjaModal) return;
    setReservando(true);
    try {
      await api.post('/turnos', { franjaId: franjaModal.id, notas: notas || undefined });
      setReservaExitosa(
        `Turno reservado para el ${formatFechaLarga(franjaModal.horario?.fecha ?? '')} a las ${franjaModal.horaInicio}`
      );
      setFranjaModal(null);
      // Recargar para quitar la franja reservada
      await cargarFranjas();
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo realizar la reserva');
      setFranjaModal(null);
    } finally {
      setReservando(false);
    }
  };

  // Guard: no renderizar hasta resolver auth
  if (
    !mounted ||
    !isAuthenticated ||
    (user?.rol && user.rol !== 'cliente' && user.rol !== undefined)
  ) {
    if (mounted && isAuthenticated && user && user.rol !== 'cliente') return null;
    if (!mounted || !isAuthenticated) return null;
  }

  return (
    <>
      <Navbar />

      {franjaModal && (
        <ModalConfirmar
          franja={franjaModal}
          onConfirm={handleReservar}
          onClose={() => setFranjaModal(null)}
          loading={reservando}
        />
      )}

      <main className="px-4 py-10 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">Reservar un turno</h1>
          <p className="text-[var(--text-muted)]">
            Encontrá un horario disponible y confirmá tu reserva en segundos
          </p>
        </div>

        {/* Mensaje de éxito */}
        {reservaExitosa && (
          <div className="mb-6 flex items-start gap-3 px-4 py-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-700 dark:text-green-400">
            <div className="shrink-0 mt-0.5">
              <IconCheck />
            </div>
            <div>
              <p className="font-semibold text-sm">¡Reserva confirmada!</p>
              <p className="text-xs mt-0.5 opacity-80">{reservaExitosa}</p>
              <button
                onClick={() => router.push('/mis-turnos')}
                className="mt-2 text-xs font-semibold underline cursor-pointer"
              >
                Ver mis turnos
              </button>
            </div>
            <button
              onClick={() => setReservaExitosa(null)}
              className="ml-auto text-green-600 hover:text-green-800 cursor-pointer text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <IconSearch />
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por servicio o profesional..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>

          {/* Filtro por servicio */}
          <select
            value={servicioSeleccionado}
            onChange={(e) => setServicioSeleccionado(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 cursor-pointer"
          >
            <option value="todos">Todos los servicios ({franjas.length} turnos)</option>
            {servicios.map((s) => {
              const count = franjas.filter((f) => f.horario?.servicio?.id === s.id).length;
              return (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({count} turnos)
                </option>
              );
            })}
          </select>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Sin turnos disponibles
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              {busqueda || servicioSeleccionado !== 'todos'
                ? 'No hay turnos que coincidan con tu búsqueda.'
                : 'No hay turnos disponibles en los próximos 30 días.'}
            </p>
            {(busqueda || servicioSeleccionado !== 'todos') && (
              <button
                onClick={() => {
                  setBusqueda('');
                  setServicioSeleccionado('todos');
                }}
                className="mt-4 text-sm text-[var(--primary)] underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {fechasOrdenadas.map((fecha) => {
              const items = porFecha[fecha];

              return (
                <div key={fecha}>
                  {/* Encabezado de fecha */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-[var(--primary)] leading-none">
                        {new Date(fecha + 'T00:00:00').getDate()}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase leading-none mt-0.5">
                        {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)] capitalize">
                        {formatFechaLarga(fecha)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {items.length} turno{items.length !== 1 ? 's' : ''} disponible
                        {items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Grid de slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((franja) => {
                      const s = franja.horario?.servicio;
                      return (
                        <div
                          key={franja.id}
                          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)] hover:shadow-md transition-all"
                        >
                          {/* Hora */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-base font-bold text-[var(--text-primary)]">
                              {franja.horaInicio} – {franja.horaFin}
                            </span>
                            {s?.precio !== null && (
                              <span className="text-sm font-bold text-[var(--primary)]">
                                ${Number(s?.precio).toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Servicio y profesional */}
                          {s && (
                            <div className="space-y-1 mb-4">
                              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                <span className="text-[var(--text-muted)]">
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                  </svg>
                                </span>
                                <span className="font-medium">{s.nombre}</span>
                                <span className="text-[var(--text-muted)]">· {s.duracion} min</span>
                              </div>
                              {s.profesional && (
                                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                  <IconUser />
                                  <span>{s.profesional.nombre}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => setFranjaModal(franja)}
                            className="w-full py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-sm font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                          >
                            Reservar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
