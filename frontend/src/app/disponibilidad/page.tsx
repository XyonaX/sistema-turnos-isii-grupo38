'use client';
import { useEffect, useState } from 'react';
import { turnoService } from '../../services/turnoService';
import { Horario } from '../../types';

export default function DisponibilidadPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    turnoService.getDisponibles().then(setHorarios).finally(() => setLoading(false));
  }, []);

  const handleReservar = async (horarioId: string) => {
    try {
      await turnoService.reservar(horarioId);
      alert('Turno reservado correctamente');
    } catch {
      alert('No se pudo reservar el turno');
    }
  };

  if (loading) return <p>Cargando horarios...</p>;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Horarios disponibles</h1>
      {horarios.length === 0 ? (
        <p>No hay horarios disponibles en los próximos 30 días.</p>
      ) : (
        <ul>
          {horarios.map((h) => (
            <li key={h.id}>
              {h.fecha} — {h.horaInicio} a {h.horaFin}
              <button onClick={() => handleReservar(h.id)} style={{ marginLeft: '1rem' }}>
                Reservar
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
