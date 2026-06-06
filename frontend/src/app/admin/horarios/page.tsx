'use client';
import React, { useEffect, useState } from 'react';

import { Navbar } from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

// Interfaz del Slot que viene del backend
interface FranjaHorariaSlot {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivoBloqueo?: string;
  estadoFranja?: {
    id: string;
    nombre: string;
  };
}

// Interfaz para poder listar los servicios en el menú desplegable
interface ServicioItem {
  id: string;
  nombre: string;
  profesional?: {
    nombre: string;
  };
}

export default function AdminHorariosPage() {
  const auth = useAuth();
  const { isAuthenticated, user } = auth;
  const isLoading = (auth as any).isLoading ?? false;
  
  const [horarios, setHorarios] = useState<FranjaHorariaSlot[]>([]);
  const [servicios, setServicios] = useState<ServicioItem[]>([]); // Nuevo estado para los servicios
  const [servicioId, setServicioId] = useState(''); // Nuevo estado para el servicio seleccionado
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [cargandoHorarios, setCargandoHorarios] = useState(true);
  

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (user?.rol?.toLowerCase() !== 'admin') return;
    cargarDatos();
  }, [isLoading, isAuthenticated, user]);

  const cargarDatos = async () => {
    try {
      setCargandoHorarios(true);
      setError(null);
      
      // Traemos las franjas horarias y los servicios en paralelo para mejorar el rendimiento
      const [horariosRes, serviciosRes] = await Promise.all([
        api.get<FranjaHorariaSlot[]>('/horarios'),
        api.get<ServicioItem[]>('/servicios')
      ]);

      setHorarios(Array.isArray(horariosRes.data) ? horariosRes.data : []);
      setServicios(Array.isArray(serviciosRes.data) ? serviciosRes.data : []);
    } catch (err) {
      console.error('Error cargando datos del panel:', err);
      setError('No se pudieron sincronizar los datos con el servidor.');
    } finally {
      setCargandoHorarios(false);
    }
  };

  const validarFormulario = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!servicioId) {
      errors.servicioId = 'Debes seleccionar un servicio para este horario';
    }
    if (!fecha) {
      errors.fecha = 'La fecha es requerida';
    } else {
      const [year, month, day] = fecha.split('-').map(Number);
      const fechaSeleccionada = new Date(year, month - 1, day);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fechaSeleccionada < hoy) errors.fecha = 'No puedes seleccionar una fecha en el pasado';
    }
    if (!horaInicio) errors.horaInicio = 'La hora de inicio es requerida';
    if (!horaFin) errors.horaFin = 'La hora de fin es requerida';
    if (horaInicio && horaFin && horaInicio >= horaFin) {
      errors.horaFin = 'La hora de fin debe ser mayor a la hora de inicio';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Mandamos el ID seleccionado dinámicamente desde el componente select
      await api.post('/horarios', { 
        servicioId, 
        fechaInicio: fecha, 
        fechaFin: fecha, 
        horaInicio, 
        horaFin 
      });

      setServicioId('');
      setFecha('');
      setHoraInicio('');
      setHoraFin('');
      setFormErrors({});
      setSuccess('✓ Horarios creados correctamente');
      setTimeout(() => { cargarDatos(); setSuccess(null); }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'No se pudo crear los horarios');
    } finally {
      setLoading(false);
    }
  };

  const cancelar = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar este horario?')) return;
    try {
      setError(null);
      await api.delete(`/horarios/${id}`);
      setSuccess('✓ Horario cancelado correctamente');
      setTimeout(() => { cargarDatos(); setSuccess(null); }, 1000);
    } catch (err: any) {
      setError('No se pudo cancelar el horario');
    }
  };

  const toggle = async (id: string) => {
    try {
      setError(null);
      await api.patch(`/horarios/${id}/toggle`);
      cargarDatos();
    } catch (err) {
      setError('No se pudo actualizar el horario');
    }
  };

  const hoy = new Date().toISOString().split('T')[0];

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <main className="flex-1 px-4 py-12 max-w-6xl mx-auto w-full">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center">
            <p className="text-yellow-600 dark:text-yellow-400 font-semibold">
              Necesitas iniciar sesión para acceder al panel de administración
            </p>
          </div>
        </main>
      </>
    );
  }

  if (user?.rol?.toLowerCase() !== 'admin') {
    return (
      <>
        <Navbar />
        <main className="flex-1 px-4 py-12 max-w-6xl mx-auto w-full">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Acceso denegado</p>
            <p className="text-red-600/70 dark:text-red-400/70 mt-2">
              Solo los administradores pueden acceder a este panel
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">🕐 Gestión de horarios</h1>
          <p className="text-[var(--text-muted)]">
            Crea y administra los horarios disponibles para que los usuarios puedan reservar
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-6 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-sm font-medium">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 sticky top-4 shadow-lg">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">✚ Crear horario</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Define un rango de horas y se crearán automáticamente slots de 1 hora
                </p>
              </div>

              <form onSubmit={crear} className="space-y-5">
                {/* SELECTOR DINÁMICO DE SERVICIOS */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">💼 Asignar al Servicio</label>
                  <select
                    value={servicioId}
                    required
                    onChange={(e) => { setServicioId(e.target.value); setFormErrors((p) => { const n = {...p}; delete n.servicioId; return n; }); }}
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${formErrors.servicioId ? 'border-red-500 bg-red-500/5' : 'border-[var(--border)] bg-[var(--bg)]'} text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  >
                    <option value="">Selecciona un servicio...</option>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} {s.profesional ? `(${s.profesional.nombre})` : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.servicioId && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.servicioId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">📅 Fecha</label>
                  <input
                    type="date" value={fecha} min={hoy} required
                    onChange={(e) => { setFecha(e.target.value); setFormErrors((p) => { const n = {...p}; delete n.fecha; return n; }); }}
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${formErrors.fecha ? 'border-red-500 bg-red-500/5' : 'border-[var(--border)] bg-[var(--bg)]'} text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  />
                  {formErrors.fecha && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.fecha}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">🕐 Hora de inicio</label>
                  <input
                    type="time" value={horaInicio} required
                    onChange={(e) => { setHoraInicio(e.target.value); setFormErrors((p) => { const n = {...p}; delete n.horaInicio; if (horaFin && e.target.value >= horaFin) { n.horaFin = 'La hora de fin debe ser mayor'; } else { delete n.horaFin; } return n; }); }}
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${formErrors.horaInicio ? 'border-red-500 bg-red-500/5' : 'border-[var(--border)] bg-[var(--bg)]'} text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  />
                  {formErrors.horaInicio && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.horaInicio}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">🕑 Hora de fin</label>
                  <input
                    type="time" value={horaFin} required
                    onChange={(e) => { setHoraFin(e.target.value); setFormErrors((p) => { const n = {...p}; delete n.horaFin; if (horaInicio && e.target.value <= horaInicio) { n.horaFin = 'La hora de fin debe ser mayor'; } return n; }); }}
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${formErrors.horaFin ? 'border-red-500 bg-red-500/5' : 'border-[var(--border)] bg-[var(--bg)]'} text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  />
                  {formErrors.horaFin && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.horaFin}</p>}
                </div>

                {fecha && horaInicio && horaFin && horaInicio < horaFin && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 mt-4">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">📊 Slots que se crearán:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        const slots = [];
                        let current = horaInicio;
                        while (current < horaFin) {
                          const [h, m] = current.split(':').map(Number);
                          const next = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                          slots.push(`${current}-${next}`);
                          current = next;
                        }
                        return slots.map((slot) => (
                          <span key={slot} className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">{slot}</span>
                        ));
                      })()}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 font-medium">
                      Total: {(() => { let count = 0; let current = horaInicio; while (current < horaFin) { count++; const [h, m] = current.split(':').map(Number); current = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`; } return count; })()} slots de 1 hora
                    </p>
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-lg transition-all shadow-md mt-6 disabled:cursor-not-allowed"
                >
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="inline-block animate-spin">⏳</span>Creando...</span> : '✓ Crear horarios'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">📋 Horarios creados</h2>

            {cargandoHorarios ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin mb-4">
                  <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-[var(--text-muted)]">Cargando horarios...</p>
              </div>
            ) : horarios.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sin horarios creados</h3>
                <p className="text-[var(--text-muted)]">Crea tu primer horario usando el formulario de la izquierda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  horarios.reduce((acc: Record<string, FranjaHorariaSlot[]>, h) => {
                    const fechaKey = h.fecha ?? '';
                    if (!fechaKey) return acc;
                    if (!acc[fechaKey]) acc[fechaKey] = [];
                    acc[fechaKey].push(h);
                    return acc;
                  }, {})
                ).sort().map(([fechaStr, horas]) => {
                  const [year, month, day] = fechaStr.split('-').map(Number);
                  const fechaObj = new Date(year, month - 1, day);
                  
                  const diaNum = fechaObj.getDate();
                  const mes = fechaObj.toLocaleDateString('es-ES', { month: 'short' });
                  const diaSemana = fechaObj.toLocaleDateString('es-ES', { weekday: 'long' });

                  return (
                    <div key={fechaStr} className="mb-6">
                      <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        {fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="space-y-2">
                        {horas.map((h) => (
                          <div key={h.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-3 text-white text-center min-w-[70px]">
                                <div className="text-sm font-bold">{diaNum}</div>
                                <div className="text-xs uppercase font-semibold">{mes}</div>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-[var(--text-primary)]">{h.horaInicio} — {h.horaFin}</p>
                                <p className="text-xs text-[var(--text-muted)] capitalize">{diaSemana}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggle(h.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  h.estadoFranja?.nombre === 'Libre'
                                    ? 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400'
                                    : 'bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
                                }`}
                              >
                                {h.estadoFranja?.nombre === 'Libre' ? '✓ Disponible' : '⏸ Bloqueado'}
                              </button>
                              <button
                                onClick={() => cancelar(h.id)}
                                className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 transition-all"
                              >
                                ✕ Cancelar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}