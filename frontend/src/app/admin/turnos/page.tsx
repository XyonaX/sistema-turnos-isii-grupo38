'use client';
import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Turno } from '../../../types';

export default function AdminTurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);

  const cargar = async () => {
    const { data } = await api.get<Turno[]>('/turnos/admin');
    setTurnos(data);
  };

  useEffect(() => { cargar(); }, []);

  const cancelar = async (id: string) => {
    await api.patch(`/turnos/admin/${id}/cancelar`);
    cargar();
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Todos los turnos</h1>
      <ul>
        {turnos.map((t) => (
          <li key={t.id}>
            {t.horario.fecha} {t.horario.horaInicio} — {t.cliente.nombre} — {t.estado}
            {t.estado !== 'cancelado' && (
              <button onClick={() => cancelar(t.id)} style={{ marginLeft: '1rem' }}>Cancelar</button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
