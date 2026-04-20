'use client';
import React from 'react';
import { Turno } from '../types';

interface TurnoCardProps {
  turno: Turno;
  onCancelar?: (id: string) => Promise<void>;
}

export function TurnoCard({ turno, onCancelar }: TurnoCardProps) {
  const [isCanceling, setIsCanceling] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

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

  const fecha = new Date(turno.horario.fecha);
  const diaNum = fecha.getDate();
  const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
  const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
  const año = fecha.getFullYear();

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmado':
        return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-700 dark:text-green-400', emoji: '✅' };
      case 'pendiente':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-700 dark:text-yellow-400', emoji: '⏳' };
      case 'cancelado':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-700 dark:text-red-400', emoji: '❌' };
      case 'completado':
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-700 dark:text-blue-400', emoji: '🎉' };
      default:
        return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-700 dark:text-gray-400', emoji: '•' };
    }
  };

  const estadoStyle = getEstadoBadge(turno.estado);

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
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-.707.707a1 1 0 101.414 1.414L9 9.414V6z" clipRule="evenodd" />
            </svg>
            <span className="text-lg font-semibold text-[var(--text-primary)]">
              {turno.horario.horaInicio} — {turno.horario.horaFin}
            </span>
          </div>

          {/* Estado Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${estadoStyle.bg} ${estadoStyle.border} ${estadoStyle.text} mb-3`}>
            <span>{estadoStyle.emoji}</span>
            <span>{turno.estado.toUpperCase()}</span>
          </div>

          {/* Notas si existen */}
          {turno.notas && (
            <p className="text-sm text-[var(--text-muted)] mt-2">
              <strong>Notas:</strong> {turno.notas}
            </p>
          )}
        </div>

        {/* Botón cancelar */}
        {turno.estado !== 'cancelado' && turno.estado !== 'completado' && onCancelar && (
          <button
            onClick={handleCancelarClick}
            disabled={isCanceling}
            className="flex-shrink-0 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            {isCanceling ? 'Cancelando...' : 'Cancelar'}
          </button>
        )}
      </div>

      {/* Detalles adicionales */}
      <div className="text-xs text-[var(--text-muted)]">
        Reservado el {new Date(turno.creadoEn).toLocaleDateString('es-ES')} a las {new Date(turno.creadoEn).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Cancelar turno</h3>
            </div>

            <p className="text-[var(--text-secondary)] mb-6">
              ¿Estás seguro de que deseas cancelar este turno del <strong>{new Date(turno.horario.fecha).toLocaleDateString('es-ES')}</strong> a las <strong>{turno.horario.horaInicio}</strong>?
            </p>

            <p className="text-sm text-[var(--text-muted)] mb-6 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
              💡 Al cancelar, el horario volverá a estar disponible para otros usuarios.
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
