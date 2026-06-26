'use client';
import type { FranjaHoraria } from '../types';

interface Props {
  horarios: FranjaHoraria[];
  onSeleccionar: (horario: FranjaHoraria) => void;
}

export function CalendarioTurnos({ horarios, onSeleccionar }: Props) {
  // Agrupar horarios por fecha y ordenarlos
  const agrupados = (horarios || []).reduce<Record<string, FranjaHoraria[]>>((acc, h) => {
    if (!h.fecha) return acc;
    const fecha = h.fecha.toString().split('T')[0];
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(h);
    return acc;
  }, {});

  const fechasOrdenadas = Object.keys(agrupados).sort();

  return (
    <div className="space-y-8">
      {fechasOrdenadas.map((fecha) => {
        const slots = agrupados[fecha].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(fecha);
        const dateObj = match
          ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
          : new Date(fecha);

        return (
          <div
            key={fecha}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 capitalize">
              {dateObj.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {slots.map((h) => (
                <button
                  key={h.id}
                  onClick={() => onSeleccionar(h)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] font-medium hover:border-blue-500 hover:text-blue-500 transition-all text-sm"
                >
                  {h.horaInicio}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {fechasOrdenadas.length === 0 && (
        <div className="text-center py-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <p className="text-[var(--text-muted)]">No hay horarios disponibles para mostrar.</p>
        </div>
      )}
    </div>
  );
}
