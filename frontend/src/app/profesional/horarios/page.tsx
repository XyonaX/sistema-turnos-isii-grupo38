'use client';
import { useEffect, useState } from 'react';

import { Navbar } from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import { servicioService } from '../../../services/servicioService';
import { horarioService } from '../../../services/horarioService';
import type { Servicio } from '../../../types';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ─── Helper functions ──────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function calcularPreview(horaInicio: string, horaFin: string, lapso: number, fechaInicio: string, fechaFin: string) {
  if (!horaInicio || !horaFin || !lapso || !fechaInicio || !fechaFin) return null;

  const minInicio = timeToMinutes(horaInicio);
  const minFin = timeToMinutes(horaFin);
  const rangoMin = minFin - minInicio;

  if (rangoMin <= 0 || lapso <= 0) return null;

  const slotsPorDia = Math.floor(rangoMin / lapso);
  if (slotsPorDia <= 0) return null;

  const inicio = new Date(fechaInicio + 'T00:00:00');
  const fin = new Date(fechaFin + 'T00:00:00');
  const diffMs = fin.getTime() - inicio.getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  if (dias <= 0) return null;

  return { slotsPorDia, dias, totalSlots: slotsPorDia * dias };
}

// Presets de lapso en minutos
const LAPSO_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora', value: 60 },
  { label: '1h 30m', value: 90 },
  { label: '2 horas', value: 120 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfesionalHorariosPage() {
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [servicioId, setServicioId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('18:00');
  const [lapsoMinutos, setLapsoMinutos] = useState(30);
  const [lapsoCustom, setLapsoCustom] = useState('');
  const [useCustomLapso, setUseCustomLapso] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      cargarServicios();
    }
  }, [mounted, isAuthenticated]);

  const cargarServicios = async () => {
    try {
      setLoadingServicios(true);
      const data = await servicioService.getMisServicios();
      setServicios(data);
      if (data.length > 0 && !servicioId) {
        setServicioId(data[0].id);
      }
    } catch {
      setError('No se pudieron cargar los servicios');
    } finally {
      setLoadingServicios(false);
    }
  };

  const lapsoFinal = useCustomLapso ? parseInt(lapsoCustom) || 0 : lapsoMinutos;
  const preview = calcularPreview(horaInicio, horaFin, lapsoFinal, fechaInicio, fechaFin);

  const validar = (): boolean => {
    const errors: Record<string, string> = {};
    if (!servicioId) errors.servicio = 'Seleccioná un servicio';
    if (!fechaInicio) errors.fechaInicio = 'Ingresá la fecha de inicio';
    if (!fechaFin) errors.fechaFin = 'Ingresá la fecha de fin';
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      errors.fechaFin = 'La fecha de fin debe ser igual o posterior al inicio';
    }
    if (!horaInicio) errors.horaInicio = 'Ingresá la hora de inicio';
    if (!horaFin) errors.horaFin = 'Ingresá la hora de fin';
    if (horaInicio && horaFin && horaFin <= horaInicio) {
      errors.horaFin = 'La hora de fin debe ser posterior al inicio';
    }
    if (lapsoFinal <= 0 || isNaN(lapsoFinal)) {
      errors.lapso = 'El lapso debe ser mayor a 0';
    }
    if (lapsoFinal > 0 && horaInicio && horaFin) {
      const rangoMin = timeToMinutes(horaFin) - timeToMinutes(horaInicio);
      if (lapsoFinal > rangoMin) {
        errors.lapso = 'El lapso es mayor que el rango horario';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const franjas = await horarioService.crear({
        servicioId,
        fechaInicio,
        fechaFin,
        horaInicio,
        horaFin,
        lapsoMinutos: lapsoFinal,
      });

      setSuccess(
        `Se generaron ${franjas.length} turno${franjas.length !== 1 ? 's' : ''} correctamente`
      );
      // Reset form
      setFechaInicio('');
      setFechaFin('');
      setFormErrors({});
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudieron generar los turnos');
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
            <p className="text-yellow-600 dark:text-yellow-400 font-semibold">Necesitas iniciar sesión</p>
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

  return (
    <>
      <Navbar />
      <main className="px-4 py-10 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <IconCalendar />
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestionar Disponibilidad</h1>
          </div>
          <p className="text-[var(--text-muted)] ml-14">
            Generá turnos disponibles para que los clientes puedan reservar
          </p>
        </div>

        {/* No services warning */}
        {!loadingServicios && servicios.length === 0 && (
          <div className="mb-6 flex items-start gap-3 px-4 py-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400">
            <IconInfo />
            <div>
              <p className="font-semibold text-sm">No tenés servicios creados</p>
              <p className="text-xs mt-0.5">
                Creá al menos un servicio en{' '}
                <a href="/profesional/servicios" className="underline font-medium">
                  Mis Servicios
                </a>{' '}
                antes de generar disponibilidad.
              </p>
            </div>
          </div>
        )}

        {/* Form card */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-7">

            {/* Servicio selector */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                Servicio
              </label>
              {loadingServicios ? (
                <div className="h-11 bg-[var(--bg)] rounded-lg animate-pulse" />
              ) : (
                <select
                  value={servicioId}
                  onChange={(e) => {
                    setServicioId(e.target.value);
                    setFormErrors((p) => { const n = { ...p }; delete n.servicio; return n; });
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all text-[var(--text-primary)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 cursor-pointer ${
                    formErrors.servicio ? 'border-red-500' : 'border-[var(--border)]'
                  }`}
                >
                  <option value="">— Seleccionar servicio —</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.duracion} min{s.precio != null ? ` · $${Number(s.precio).toFixed(2)}` : ''})
                    </option>
                  ))}
                </select>
              )}
              {formErrors.servicio && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.servicio}</p>
              )}
            </div>

            {/* Date range */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] mb-3">
                <IconCalendar />
                Rango de fechas
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Desde</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    min={today}
                    onChange={(e) => {
                      setFechaInicio(e.target.value);
                      setFormErrors((p) => { const n = { ...p }; delete n.fechaInicio; return n; });
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all text-[var(--text-primary)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 cursor-pointer ${
                      formErrors.fechaInicio ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  {formErrors.fechaInicio && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.fechaInicio}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Hasta</label>
                  <input
                    type="date"
                    value={fechaFin}
                    min={fechaInicio || today}
                    onChange={(e) => {
                      setFechaFin(e.target.value);
                      setFormErrors((p) => { const n = { ...p }; delete n.fechaFin; return n; });
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all text-[var(--text-primary)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 cursor-pointer ${
                      formErrors.fechaFin ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  {formErrors.fechaFin && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.fechaFin}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Time range */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] mb-3">
                <IconClock />
                Rango horario
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Hora inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => {
                      setHoraInicio(e.target.value);
                      setFormErrors((p) => { const n = { ...p }; delete n.horaInicio; delete n.horaFin; return n; });
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all text-[var(--text-primary)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 cursor-pointer ${
                      formErrors.horaInicio ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  {formErrors.horaInicio && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.horaInicio}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Hora fin</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => {
                      setHoraFin(e.target.value);
                      setFormErrors((p) => { const n = { ...p }; delete n.horaFin; return n; });
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all text-[var(--text-primary)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 cursor-pointer ${
                      formErrors.horaFin ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  {formErrors.horaFin && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.horaFin}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Lapso selector */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                Duración de cada turno
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {LAPSO_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setLapsoMinutos(p.value);
                      setUseCustomLapso(false);
                      setFormErrors((prev) => { const n = { ...prev }; delete n.lapso; return n; });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                      !useCustomLapso && lapsoMinutos === p.value
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseCustomLapso(true)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                    useCustomLapso
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                  }`}
                >
                  Personalizado
                </button>
              </div>
              {useCustomLapso && (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={lapsoCustom}
                    onChange={(e) => {
                      setLapsoCustom(e.target.value);
                      setFormErrors((p) => { const n = { ...p }; delete n.lapso; return n; });
                    }}
                    placeholder="ej: 25"
                    min="5"
                    max="480"
                    className={`w-32 px-4 py-2.5 rounded-lg border transition-all text-[var(--text-primary)] bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 ${
                      formErrors.lapso ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  <span className="text-sm text-[var(--text-muted)]">minutos</span>
                </div>
              )}
              {formErrors.lapso && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.lapso}</p>
              )}
            </div>

            {/* Preview box */}
            {preview && (
              <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-5">
                <p className="text-sm font-semibold text-[var(--primary)] mb-3">Vista previa</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{preview.slotsPorDia}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">turnos/día</p>
                  </div>
                  <div className="border-x border-[var(--border)]">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{preview.dias}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">día{preview.dias !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--primary)]">{preview.totalSlots}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">turnos totales</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-3 text-center">
                  Cada turno dura {lapsoFinal} min · de {horaInicio} a {horaFin}
                </p>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                <IconInfo />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-sm font-medium">
                <IconCheck />
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || servicios.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] disabled:bg-gray-400 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generando turnos...
                </>
              ) : (
                <>
                  <IconCalendar />
                  Generar turnos disponibles
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
