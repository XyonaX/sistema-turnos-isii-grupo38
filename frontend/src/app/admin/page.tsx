import Link from 'next/link';
import { Navbar } from '../../components/Navbar';

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <main style={{ padding: '2rem' }}>
        <h1>Panel de administración</h1>
        <nav>
          <Link href="/admin/horarios">Gestionar horarios</Link> |{' '}
          <Link href="/admin/turnos">Ver todos los turnos</Link>
        </nav>
      </main>
    </>
  );
}
