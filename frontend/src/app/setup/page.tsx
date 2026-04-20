'use client';

import { useState } from 'react';
import { api } from '@/services/api';

export default function SetupPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validaciones
    if (!nombre || !email || !password || !confirmPassword) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/setup', {
        nombre,
        email,
        password,
      });

      setSuccess(true);
      setMessage(response.data.message || '✓ Administrador creado exitosamente');
      setNombre('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al crear el administrador'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div
        className="w-full max-w-md rounded-lg shadow-lg p-8"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          🔧 Setup Inicial
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
          Crea la cuenta del administrador del sistema
        </p>

        {success ? (
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgb(34, 197, 94)' }} className="border">
            <p style={{ color: 'rgb(34, 197, 94)' }} className="font-semibold">
              {message}
            </p>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-2">
              Redirigiendo al login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                📝 Nombre Completo
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: error && !nombre ? 'rgb(239, 68, 68)' : 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                📧 Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: error && !email ? 'rgb(239, 68, 68)' : 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="admin@ejemplo.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                🔒 Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: error && !password ? 'rgb(239, 68, 68)' : 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                ✓ Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: error && !confirmPassword ? 'rgb(239, 68, 68)' : 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Repite tu contraseña"
              />
            </div>

            {error && (
              <div
                className="p-3 rounded-lg border"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgb(239, 68, 68)' }}
              >
                <p style={{ color: 'rgb(239, 68, 68)' }} className="text-sm font-medium">
                  ❌ {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg font-semibold transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: 'var(--primary, rgb(59, 130, 246))',
                color: 'white',
              }}
            >
              {loading ? 'Creando...' : '✓ Crear Administrador'}
            </button>
          </form>
        )}

        <p className="text-sm text-center mt-6" style={{ color: 'var(--text-muted)' }}>
          Esta página solo funciona una sola vez<br />
          (cuando no existe administrador en el sistema)
        </p>
      </div>
    </div>
  );
}
