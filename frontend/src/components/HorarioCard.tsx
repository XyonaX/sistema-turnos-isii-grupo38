'use client';
import React from 'react';
import type { FranjaHoraria } from '../types';

interface HorarioCardProps {
  horario: FranjaHoraria;
  onReservar: (franjaId: string) => Promise<void>;
  loading?: boolean;
  isAdmin?: boolean;
  onCancelar?: (horarioId: string) => Promise<void>;
  cancelarLoading?: boolean;
}

export function HorarioCard({
  horario,
  onReservar,
  loading = false,
  isAdmin = false,
  onCancelar,
  cancelarLoading = false,
}: HorarioCardProps) {
  const [isReserving, setIsReserving] = React.useState(false);
  const [isCanceling, setIsCanceling] = React.useState(false);

  const handleClick = async () => {
    setIsReserving(true);
    try {
      await onReservar(horario.id);
    } finally {
      setIsReserving(false);
    }
  };

  const handleCancelar = async () => {
    if (!onCancelar) return;

    if (!confirm('¿Estás seguro de que deseas cancelar este horario?')) {
      return;
    }

    setIsCanceling(true);
    try {
      await onCancelar(horario.id);
    } finally {
      setIsCanceling(false);
    }
  };

  const fechaStr = horario.horario?.fecha ?? '';
  const fecha = fechaStr ? new Date(fechaStr + 'T00:00:00') : new Date();
  const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
  const diaNum = fecha.getDate();
  const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });

  return (
    <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-alt)] border border-[var(--border)] rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        {/* Fecha */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-white text-center min-w-[100px]">
            <div className="text-2xl font-bold">{diaNum}</div>
            <div className="text-xs uppercase font-semibold tracking-wide">{mes}</div>
            <div className="text-xs mt-1 opacity-90">{diaSemana}</div>
          </div>
        </div>

        {/* Horario e información */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-.707.707a1 1 0 101.414 1.414L9 9.414V6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-lg font-semibold text-[var(--text-primary)]">
              {horario.horaInicio} — {horario.horaFin}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Duración: {calcularDuracion(horario.horaInicio, horario.horaFin)} minutos
          </p>
        </div>

        {/* Botón único */}
        {isAdmin ? (
          <button
            onClick={handleCancelar}
            disabled={isCanceling || cancelarLoading}
            className="flex-shrink-0 w-full md:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-600 dark:text-red-400 font-semibold rounded-xl transition-all disabled:opacity-50"
            title="Cancelar este horario"
          >
            {isCanceling ? (
              <span className="flex items-center justify-center gap-1">
                <span className="inline-block animate-spin">⏳</span>
                Cancelando...
              </span>
            ) : (
              '✕ Cancelar'
            )}
          </button>
        ) : (
          <button
            onClick={handleClick}
            disabled={isReserving || loading}
            className="flex-shrink-0 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            {isReserving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">⏳</span>
                Reservando...
              </span>
            ) : (
              'Reservar'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function calcularDuracion(inicio: string, fin: string): number {
  const [hI, mI] = inicio.split(':').map(Number);
  const [hF, mF] = fin.split(':').map(Number);
  return hF * 60 + mF - (hI * 60 + mI);
}
