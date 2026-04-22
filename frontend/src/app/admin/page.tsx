'use client';
import { useCallback, useEffect, useState } from 'react';

import { HorarioCard } from '../../components/HorarioCard';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { turnoService } from '../../services/turnoService';
import type { Horario } from '../../types';

export default function DisponibilidadPage() {
  const { user } = useAuth();
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservedHorarios, setReservedHorarios] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Estados para el formulario de crear
  const [showForm, setShowForm] = useState(false);
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [cancelarLoading, setCancelarLoading] = useState<string | null>(null);

  const cargarHorarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await turnoService.getDisponibles();
      setHorarios(data as Horario[]);

      // Seleccionar la primera fecha disponible
      if (data.length > 0 && !selectedDate) {
        setSelectedDate(data[0].horario?.fecha || null);
      }
    } catch (err) {
      setError('No se pudieron cargar los horarios disponibles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    cargarHorarios();
  }, [cargarHorarios]);

  const handleReservar = async (horarioId: string) => {
    try {
      setError(null);
      setSuccess(null);
      await turnoService.reservar(horarioId);
      setReservedHorarios((prev) => new Set([...prev, horarioId]));
      setSuccess('¡Turno reservado correctamente! Podés verlo en "Mis turnos"');

      // Eliminar el horario de la lista localmente (no disponible)
      setHorarios((prev) => prev.filter((h) => h.id !== horarioId));

      // Recargar horarios completos después de un tiempo para sincronizar
      setTimeout(cargarHorarios, 2000);
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.message || 'No se pudo reservar el turno. Intenta de nuevo.');
      console.error(err);
    }
  };

  const validarFormulario = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fecha) {
      errors.fecha = 'La fecha es requerida';
    } else {
      const fechaSeleccionada = new Date(fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaSeleccionada < hoy) {
        errors.fecha = 'No puedes seleccionar una fecha en el pasado';
      }
    }

    if (!horaInicio) {
      errors.horaInicio = 'La hora de inicio es requerida';
    }

    if (!horaFin) {
      errors.horaFin = 'La hora de fin es requerida';
    }

    if (horaInicio && horaFin && horaInicio >= horaFin) {
      errors.horaFin = 'La hora de fin debe ser mayor a la hora de inicio';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const crearHorarios = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setLoadingForm(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/horarios', {
        fecha,
        horaInicio,
        horaFin,
      });

      setFecha('');
      setHoraInicio('');
      setHoraFin('');
      setFormErrors({});
      setSuccess('✓ Horarios creados correctamente');
      setShowForm(false);

      setTimeout(() => {
        cargarHorarios();
        setSuccess(null);
      }, 1000);
    } catch (err) {
      console.error('Error creando horario:', err);
      const error = err as any;
      const mensajeError =
        error.response?.data?.message || error.message || 'No se pudo crear los horarios';
      setError(mensajeError);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleCancelar = async (horarioId: string) => {
    try {
      setCancelarLoading(horarioId);
      setError(null);
      await api.delete(`/horarios/${horarioId}`);
      setSuccess('✓ Horario cancelado correctamente');
      setTimeout(() => {
        cargarHorarios();
        setSuccess(null);
      }, 800);
    } catch (err) {
      console.error('Error cancelando horario:', err);
      const error = err as any;
      const mensajeError =
        error.response?.data?.message || error.message || 'No se pudo cancelar el horario';
      setError(mensajeError);
    } finally {
      setCancelarLoading(null);
    }
  };

  // Agrupar horarios por fecha
  const horariosPorFecha = horarios.reduce(
    (acc, h) => {
      if (!acc[h.fecha]) acc[h.fecha] = [];
      acc[h.fecha].push(h);
      return acc;
    },
    {} as Record<string, Horario[]>
  );

  const fechasDisponibles = Object.keys(horariosPorFecha).sort();
  const horariosDelDiaSeleccionado = selectedDate ? horariosPorFecha[selectedDate] || [] : [];
  const hoy = new Date().toISOString().split('T')[0];
  const esAdmin = user?.rol === 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 px-4 py-12 max-w-6xl mx-auto w-full">
        {/* Admin Badge */}
        {esAdmin && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <span className="text-purple-600 dark:text-purple-400 text-sm font-semibold">
              👑 Modo Admin
            </span>
          </div>
        )}
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            {esAdmin ? (
              <>
                <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
                  📋 Gestionar Horarios
                </h1>
                <p className="text-[var(--text-muted)]">
                  Crea nuevos horarios o cancela los existentes
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
                  Reservar un turno
                </h1>
                <p className="text-[var(--text-muted)]">
                  Selecciona una fecha y hora que te convenga
                </p>
              </>
            )}
          </div>
          {esAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-lg transition-all shadow-md"
            >
              + Crear horario
            </button>
          )}
        </div>

        {/* Formulario Modal */}
        {showForm && esAdmin && (
          <div className="mb-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                ✚ Crear nuevos horarios
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={crearHorarios} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    📅 Fecha
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => {
                      setFecha(e.target.value);
                      setFormErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.fecha;
                        return newErrors;
                      });
                    }}
                    min={hoy}
                    required
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${
                      formErrors.fecha
                        ? 'border-red-500 bg-red-500/5'
                        : 'border-[var(--border)] bg-[var(--bg)]'
                    } text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  />
                  {formErrors.fecha && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.fecha}</p>
                  )}
                </div>

                {/* Hora Inicio */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    🕐 Hora inicio
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => {
                      setHoraInicio(e.target.value);
                      setFormErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.horaInicio;
                        if (horaFin && e.target.value >= horaFin) {
                          newErrors.horaFin = 'La hora de fin debe ser mayor';
                        } else {
                          delete newErrors.horaFin;
                        }
                        return newErrors;
                      });
                    }}
                    required
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${
                      formErrors.horaInicio
                        ? 'border-red-500 bg-red-500/5'
                        : 'border-[var(--border)] bg-[var(--bg)]'
                    } text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  />
                  {formErrors.horaInicio && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {formErrors.horaInicio}
                    </p>
                  )}
                </div>

                {/* Hora Fin */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    🕑 Hora fin
                  </label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => {
                      setHoraFin(e.target.value);
                      setFormErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.horaFin;
                        if (horaInicio && e.target.value <= horaInicio) {
                          newErrors.horaFin = 'Debe ser mayor que la hora inicio';
                        }
                        return newErrors;
                      });
                    }}
                    required
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${
                      formErrors.horaFin
                        ? 'border-red-500 bg-red-500/5'
                        : 'border-[var(--border)] bg-[var(--bg)]'
                    } text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  />
                  {formErrors.horaFin && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.horaFin}</p>
                  )}
                </div>
              </div>

              {/* Preview de slots */}
              {fecha && horaInicio && horaFin && horaInicio < horaFin && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    📊 Se crearán{' '}
                    {(() => {
                      let count = 0;
                      let current = horaInicio;
                      while (current < horaFin) {
                        count++;
                        const [h, m] = current.split(':').map(Number);
                        current = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                      }
                      return count;
                    })()}{' '}
                    slots de 1 hora
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-lg transition-all"
                >
                  {loadingForm ? 'Creando...' : '✓ Crear horarios'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--bg)] transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-6 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-sm font-medium">
            ✓ {success}
          </div>
        )}

        {/* Content */}
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
            <p className="text-[var(--text-muted)]">Cargando horarios disponibles...</p>
          </div>
        ) : fechasDisponibles.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No hay horarios disponibles
            </h3>
            <p className="text-[var(--text-muted)]">
              No hay horarios disponibles en los próximos 30 días. Vuelve más tarde.
            </p>
            {esAdmin && (
              <p className="text-blue-600 dark:text-blue-400 text-sm mt-4">
                💡 Como admin, usa el botón `Crear horario` arriba para agregar nuevos
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Selector de fechas (izquierda) */}
            <div className="lg:col-span-1">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sticky top-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">📅 Fechas</h2>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {fechasDisponibles.map((fecha) => {
                    const date = new Date(fecha);
                    const isSelected = selectedDate === fecha;
                    const numHorarios = horariosPorFecha[fecha]?.length || 0;

                    return (
                      <button
                        key={fecha}
                        onClick={() => setSelectedDate(fecha)}
                        className={`w-full p-3 rounded-lg text-left transition-all border ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-500 shadow-md'
                            : 'bg-[var(--bg)] border-[var(--border)] hover:border-blue-500/50'
                        }`}
                      >
                        <div
                          className={`font-semibold text-sm ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-primary)]'}`}
                        >
                          {date.toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                        <div
                          className={`text-xs ${isSelected ? 'text-blue-500/70' : 'text-[var(--text-muted)]'}`}
                        >
                          {numHorarios} {numHorarios === 1 ? 'slot' : 'slots'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Horarios del día seleccionado (derecha) */}
            <div className="lg:col-span-3">
              {selectedDate && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                      {new Date(selectedDate).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </h2>
                    <p className="text-[var(--text-muted)]">
                      {horariosDelDiaSeleccionado.length} horarios disponibles
                    </p>
                  </div>

                  {horariosDelDiaSeleccionado.length === 0 ? (
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
                      <div className="text-4xl mb-4">😴</div>
                      <p className="text-[var(--text-muted)]">
                        No hay horarios disponibles para este día
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {horariosDelDiaSeleccionado.map((horario) => (
                        <HorarioCard
                          key={horario.id}
                          horario={horario}
                          onReservar={() => handleReservar(horario.id)}
                          loading={reservedHorarios.has(horario.id)}
                          isAdmin={esAdmin}
                          onCancelar={() => handleCancelar(horario.id)}
                          cancelarLoading={cancelarLoading === horario.id}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
