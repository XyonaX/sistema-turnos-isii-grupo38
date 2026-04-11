'use client';
import Link from 'next/link';
import { authService } from '../services/authService';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  return (
    <nav style={{ padding: '1rem', background: '#1a1a2e', color: 'white', display: 'flex', gap: '1rem' }}>
      <Link href="/" style={{ color: 'white' }}>Inicio</Link>
      <Link href="/disponibilidad" style={{ color: 'white' }}>Disponibilidad</Link>
      <Link href="/mis-turnos" style={{ color: 'white' }}>Mis turnos</Link>
      <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
        Cerrar sesión
      </button>
    </nav>
  );
}
