import Link from 'next/link';

export default function AdminPage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Panel de administración</h1>
      <nav>
        <Link href="/admin/horarios">Gestionar horarios</Link> |{' '}
        <Link href="/admin/turnos">Ver todos los turnos</Link>
      </nav>
    </main>
  );
}
