'use client';
import { useState } from 'react';
import { authService } from '../../services/authService';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.register(nombre, email, password);
      router.push('/login');
    } catch {
      setError('Error al registrarse. El correo puede estar en uso.');
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Registrarse</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div><label>Nombre: </label><input value={nombre} onChange={(e) => setNombre(e.target.value)} required /></div>
        <div><label>Email: </label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label>Contraseña: </label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <button type="submit">Registrarse</button>
      </form>
    </main>
  );
}
