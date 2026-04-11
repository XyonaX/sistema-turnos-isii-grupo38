import { Turno } from '../types';

interface Props {
  turno: Turno;
  onCancelar?: (id: string) => void;
}

export function TurnoCard({ turno, onCancelar }: Props) {
  const fecha = new Date(turno.horario.fecha).toLocaleDateString('es-AR');
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '0.5rem' }}>
      <p><strong>Fecha:</strong> {fecha} — {turno.horario.horaInicio} a {turno.horario.horaFin}</p>
      <p><strong>Estado:</strong> {turno.estado}</p>
      {turno.notas && <p><strong>Notas:</strong> {turno.notas}</p>}
      {turno.estado !== 'cancelado' && onCancelar && (
        <button onClick={() => onCancelar(turno.id)}>Cancelar turno</button>
      )}
    </div>
  );
}
