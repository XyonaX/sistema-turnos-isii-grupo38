'use client';
import { useEffect, useState } from 'react';
import { turnoService } from '../../services/turnoService';
import { Turno } from '../../types';

export default function MisTurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);

  useEffect(() => {
    turnoService.getMisTurnos().then(setTurnos);
  }, []);

  const handleCancelar = async (id: string) => {
    try {
      await turnoService.cancelar(id);
      setTurnos((prev) => prev.map((t) => t.id === id ? { ...t, estado: 'cancelado' } : t));
    } catch {
      alert('No se pudo cancelar el turno');
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Mis turnos</h1>
      {turnos.length === 0 ? (
        <p>No tenés turnos registrados.</p>
      ) : (
        <ul>
          {turnos.map((t) => (
            <li key={t.id}>
              {t.horario.fecha} {t.horario.horaInicio} — Estado: <strong>{t.estado}</strong>
              {t.estado !== 'cancelado' && (
                <button onClick={() => handleCancelar(t.id)} style={{ marginLeft: '1rem' }}>
                  Cancelar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
