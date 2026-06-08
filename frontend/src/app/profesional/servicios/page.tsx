'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Navbar } from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import { servicioService } from '../../../services/servicioService';
import type { Servicio } from '../../../types';

export default function ProfesionalServiciosPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracion, setDuracion] = useState('60');
  const [precio, setPrecio] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loadingForm, setLoadingForm] = useState(false);

  // Edit modal states
  const [servicioEditando, setServicioEditando] = useState<Servicio | null>(null);
  const [formEditar, setFormEditar] = useState({ nombre: '', descripcion: '', duracionMinutos: 60, precio: 0 });
  const [editando, setEditando] = useState(false);
  const [errorEditar, setErrorEditar] = useState<string | null>(null);

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
      setLoading(true);
      setError(null);
      const data = await servicioService.getMisServicios();
      setServicios(data);
    } catch (err) {
      console.error('Error cargando servicios:', err);
      setError('No se pudieron cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = (): boolean => {
    const errors: Record<string, string> = {};

    if (!nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }

    if (!descripcion.trim()) {
      errors.descripcion = 'La descripción es requerida';
    }

    if (!duracion || parseInt(duracion) < 15) {
      errors.duracion = 'La duración mínima es 15 minutos';
    }

    if (!precio || parseFloat(precio) <= 0) {
      errors.precio = 'El precio debe ser mayor a 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const crearServicio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setLoadingForm(true);
    setError(null);
    setSuccess(null);

    try {
      await servicioService.crearServicio({
        nombre,
        descripcion,
        duracionMinutos: parseInt(duracion),
        precio: parseFloat(precio),
      });

      setNombre('');
      setDescripcion('');
      setDuracion('60');
      setPrecio('');
      setFormErrors({});
      setSuccess('Servicio creado correctamente');
      setShowForm(false);

      setTimeout(() => {
        cargarServicios();
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error creando servicio:', err);
      setError(err.response?.data?.message || 'No se pudo crear el servicio');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioEditando) return;
    if (!formEditar.nombre.trim()) {
      setErrorEditar('El nombre es requerido');
      return;
    }
    if (formEditar.duracionMinutos < 15) {
      setErrorEditar('La duración mínima es 15 minutos');
      return;
    }
    if (formEditar.precio < 0) {
      setErrorEditar('El precio no puede ser negativo');
      return;
    }
    setEditando(true);
    setErrorEditar(null);
    try {
      await servicioService.actualizarServicio(servicioEditando.id, formEditar);
      setServicioEditando(null);
      await cargarServicios();
    } catch (err: any) {
      setErrorEditar(err.response?.data?.message || 'Error al actualizar el servicio');
    } finally {
      setEditando(false);
    }
  };

  const eliminarServicio = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      setError(null);
      await servicioService.eliminarServicio(id);
      setSuccess('Servicio eliminado correctamente');
      setTimeout(() => {
        cargarServicios();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError('No se pudo eliminar el servicio');
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">🛠️ Mis Servicios</h1>
            <p className="text-[var(--text-muted)]">Crea y gestiona los servicios que ofreces</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-lg transition-all shadow-md"
          >
            + Crear servicio
          </button>
        </div>

        {/* Formulario Modal */}
        {showForm && (
          <div className="mb-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">✚ Crear servicio</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={crearServicio} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    📝 Nombre del servicio
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value);
                      if (formErrors.nombre) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.nombre;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="ej: Consulta General"
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${
                      formErrors.nombre
                        ? 'border-red-500 bg-red-500/5'
                        : 'border-[var(--border)] bg-[var(--bg)]'
                    } text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  />
                  {formErrors.nombre && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.nombre}</p>
                  )}
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    ⏱️ Duración (minutos)
                  </label>
                  <input
                    type="number"
                    value={duracion}
                    onChange={(e) => {
                      setDuracion(e.target.value);
                      if (formErrors.duracion) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.duracion;
                          return newErrors;
                        });
                      }
                    }}
                    min="1"
                    step="1"
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${
                      formErrors.duracion
                        ? 'border-red-500 bg-red-500/5'
                        : 'border-[var(--border)] bg-[var(--bg)]'
                    } text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                  />
                  {formErrors.duracion && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.duracion}</p>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  📄 Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => {
                    setDescripcion(e.target.value);
                    if (formErrors.descripcion) {
                      setFormErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.descripcion;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Describe tu servicio..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    formErrors.descripcion
                      ? 'border-red-500 bg-red-500/5'
                      : 'border-[var(--border)] bg-[var(--bg)]'
                  } text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none`}
                />
                {formErrors.descripcion && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {formErrors.descripcion}
                  </p>
                )}
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  💰 Precio
                </label>
                <input
                  type="number"
                  value={precio}
                  onChange={(e) => {
                    setPrecio(e.target.value);
                    if (formErrors.precio) {
                      setFormErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.precio;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    formErrors.precio
                      ? 'border-red-500 bg-red-500/5'
                      : 'border-[var(--border)] bg-[var(--bg)]'
                  } text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                />
                {formErrors.precio && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.precio}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-lg transition-all"
                >
                  {loadingForm ? 'Creando...' : '✓ Crear servicio'}
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

        {/* Modal de Edición */}
        {servicioEditando && (
          <div className="mb-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">✏️ Editar servicio</h2>
              <button
                onClick={() => setServicioEditando(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditar} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    📝 Nombre del servicio
                  </label>
                  <input
                    type="text"
                    value={formEditar.nombre}
                    onChange={(e) => setFormEditar((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="ej: Consulta General"
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    ⏱️ Duración (minutos)
                  </label>
                  <input
                    type="number"
                    value={formEditar.duracionMinutos}
                    onChange={(e) =>
                      setFormEditar((prev) => ({ ...prev, duracionMinutos: parseInt(e.target.value) || 0 }))
                    }
                    min="15"
                    step="1"
                    className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  📄 Descripción
                </label>
                <textarea
                  value={formEditar.descripcion}
                  onChange={(e) => setFormEditar((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Describe tu servicio..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none transition-all"
                />
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  💰 Precio
                </label>
                <input
                  type="number"
                  value={formEditar.precio}
                  onChange={(e) =>
                    setFormEditar((prev) => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>

              {errorEditar && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                  ⚠️ {errorEditar}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={editando}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-lg transition-all"
                >
                  {editando ? 'Guardando...' : '✓ Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setServicioEditando(null)}
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
            <p className="text-[var(--text-muted)]">Cargando servicios...</p>
          </div>
        ) : servicios.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Sin servicios creados
            </h3>
            <p className="text-[var(--text-muted)]">
              Crea tu primer servicio para que los clientes puedan reservar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio) => (
              <div
                key={servicio.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)] mb-1">
                      {servicio.nombre}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">{servicio.duracionMinutos} minutos</p>
                  </div>
                  {servicio.precio !== null && (
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(servicio.precio).toFixed(2)}
                    </span>
                  )}
                </div>

                <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">
                  {servicio.descripcion}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setServicioEditando(servicio);
                      setFormEditar({
                        nombre: servicio.nombre,
                        descripcion: servicio.descripcion || '',
                        duracionMinutos: servicio.duracionMinutos ?? 60,
                        precio: servicio.precio || 0,
                      });
                      setErrorEditar(null);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold transition-all"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => eliminarServicio(servicio.id)}
                    className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold transition-all"
                  >
                    ✕ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
