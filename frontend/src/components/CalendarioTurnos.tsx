'use client';
import { Horario } from '../types';

interface Props {
  horarios: Horario[];
  onSeleccionar: (horario: Horario) => void;
}

export function CalendarioTurnos({ horarios, onSeleccionar }: Props) {
  const agrupados = horarios.reduce<Record<string, Horario[]>>((acc, h) => {
    const fecha = h.fecha.toString().split('T')[0];
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(h);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(agrupados).map(([fecha, slots]) => (
        <div key={fecha}>
          <h3>{fecha}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {slots.map((h) => (
              <button key={h.id} onClick={() => onSeleccionar(h)}>
                {h.horaInicio}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
