'use client';
import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Horario } from '../../../types';

export default function AdminHorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  const cargar = async () => {
    const { data } = await api.get<Horario[]>('/horarios');
    setHorarios(data);
  };

  useEffect(() => { cargar(); }, []);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/horarios', { fecha, horaInicio, horaFin });
    cargar();
  };

  const toggle = async (id: string) => {
    await api.patch(`/horarios/${id}/toggle`);
    cargar();
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Gestión de horarios</h1>
      <form onSubmit={crear}>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
        <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
        <button type="submit">Crear horario</button>
      </form>
      <ul>
        {horarios.map((h) => (
          <li key={h.id}>
            {h.fecha} {h.horaInicio}-{h.horaFin} — {h.disponible ? 'Disponible' : 'Bloqueado'}
            <button onClick={() => toggle(h.id)} style={{ marginLeft: '1rem' }}>
              {h.disponible ? 'Bloquear' : 'Habilitar'}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
