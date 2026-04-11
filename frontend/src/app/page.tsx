import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sistema de Gestión de Turnos</h1>
      <p>Reservá tu turno de forma rápida y sencilla.</p>
      <nav>
        <Link href="/login">Iniciar sesión</Link> |{' '}
        <Link href="/register">Registrarse</Link> |{' '}
        <Link href="/disponibilidad">Ver disponibilidad</Link>
      </nav>
    </main>
  );
}
