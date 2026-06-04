'use client';
import React from 'react';

import type { Turno } from '../types';

interface TurnoCardProps {
  turno: Turno;
  onCancelar?: (id: string) => Promise<void>;
}

export function TurnoCard({ turno, onCancelar }: TurnoCardProps) {
  const [isCanceling, setIsCanceling] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

  // Determina si se puede cancelar (>= 3 hs de anticipación)
  const cancelInfo = React.useMemo(() => {
    if (turno.estadoTurno?.nombre === 'Cancelado' || turno.estadoTurno?.nombre === 'Completado') {
      return { canCancel: false, horasRestantes: 0 };
    }
    const fecha = turno.franja?.fecha;
    const horaInicio = turno.franja?.horaInicio;
    if (!fecha || !horaInicio) return { canCancel: false, horasRestantes: 0 };

    const [h, m] = horaInicio.split(':').map(Number);
    const turnoDate = new Date(fecha + 'T00:00:00');
    turnoDate.setHours(h, m, 0, 0);
    const diffMs = turnoDate.getTime() - Date.now();
    const horasRestantes = Math.max(0, diffMs / (1000 * 60 * 60));
    return { canCancel: horasRestantes >= 3, horasRestantes };
  }, [turno]);

  const handleCancelarClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmarCancelacion = async () => {
    if (!onCancelar) return;
    setIsCanceling(true);
    try {
      await onCancelar(turno.id);
      setShowConfirmModal(false);
    } finally {
      setIsCanceling(false);
    }
  };

  const fechaStr = turno.franja?.fecha ?? '';
  const fecha = fechaStr ? new Date(fechaStr + 'T00:00:00') : new Date();
  const diaNum = fecha.getDate();
  const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
  const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'short' });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Confirmado':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'text-green-700 dark:text-green-400',
          dot: 'bg-green-500',
        };
      case 'Pendiente':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-700 dark:text-yellow-400',
          dot: 'bg-yellow-500',
        };
      case 'Cancelado':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-700 dark:text-red-400',
          dot: 'bg-red-500',
        };
      case 'Completado':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-700 dark:text-blue-400',
          dot: 'bg-blue-500',
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-700 dark:text-gray-400',
          dot: 'bg-gray-500',
        };
    }
  };

  const estadoStyle = getEstadoBadge(turno.estadoTurno?.nombre ?? '');

  return (
    <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-alt)] border border-[var(--border)] rounded-2xl p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Fecha */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-4 text-white text-center min-w-[100px]">
            <div className="text-2xl font-bold">{diaNum}</div>
            <div className="text-xs uppercase font-semibold tracking-wide">{mes}</div>
            <div className="text-xs mt-1 opacity-90">{diaSemana}</div>
          </div>
        </div>

        {/* Información */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-.707.707a1 1 0 101.414 1.414L9 9.414V6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-lg font-semibold text-[var(--text-primary)]">
              {turno.franja?.horaInicio ?? '—'} — {turno.franja?.horaFin ?? '—'}
            </span>
          </div>

          {/* Estado Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${estadoStyle.bg} ${estadoStyle.border} ${estadoStyle.text} mb-3`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${estadoStyle.dot}`} />
            <span>{(turno.estadoTurno?.nombre ?? '').toUpperCase()}</span>
          </div>

          {/* Notas si existen */}
          {turno.notas && (
            <p className="text-sm text-[var(--text-muted)] mt-2">
              <strong>Notas:</strong> {turno.notas}
            </p>
          )}
        </div>

        {/* Botón cancelar */}
        {turno.estadoTurno?.nombre !== 'Cancelado' && turno.estadoTurno?.nombre !== 'Completado' && onCancelar && (
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <button
              onClick={cancelInfo.canCancel ? handleCancelarClick : undefined}
              disabled={isCanceling || !cancelInfo.canCancel}
              title={
                !cancelInfo.canCancel
                  ? `Solo se puede cancelar con al menos 3 horas de anticipación. Quedan ${cancelInfo.horasRestantes.toFixed(1)}hs.`
                  : 'Cancelar turno'
              }
              className={`px-4 py-2 border font-semibold rounded-lg transition-all
                ${
                  cancelInfo.canCancel
                    ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400 cursor-pointer'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed opacity-60'
                } disabled:opacity-50`}
            >
              {isCanceling ? 'Cancelando...' : 'Cancelar'}
            </button>
            {!cancelInfo.canCancel && (
              <span className="text-[10px] text-[var(--text-muted)] text-right leading-tight max-w-[110px]">
                Mín. 3hs de anticipación
              </span>
            )}
          </div>
        )}
      </div>

      {/* Detalles adicionales */}
      <div className="text-xs text-[var(--text-muted)]">
        Reservado el {new Date(turno.creadoEn).toLocaleDateString('es-ES')} a las{' '}
        {new Date(turno.creadoEn).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>

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
              ¿Estás seguro de que deseas cancelar este turno del{' '}
              <strong>
                {fechaStr ? new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-ES') : '—'}
              </strong>{' '}
              a las <strong>{turno.franja?.horaInicio ?? '—'}</strong>?
            </p>

            <p className="text-sm text-[var(--text-muted)] mb-6 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
              Al cancelar, el horario volverá a estar disponible para otros usuarios. Recordá que
              solo podés cancelar con al menos 3 horas de anticipación.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isCanceling}
                className="px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--bg)] transition-all disabled:opacity-50"
              >
                Mantener
              </button>
              <button
                onClick={handleConfirmarCancelacion}
                disabled={isCanceling}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all"
              >
                {isCanceling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
