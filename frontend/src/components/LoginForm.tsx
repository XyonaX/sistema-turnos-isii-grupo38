'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useAuth } from '../context/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm({
  onSwitch,
}: {
  onSwitch: (mode: 'home' | 'login' | 'register') => void;
}) {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

const onSubmit = async (data: LoginFormData) => {
  setServerError('');
  try {
    // 1. Logueamos
    await login(data.email, data.password);

    // 2. Obtenemos el token del localStorage
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Decodificación del payload del JWT
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      // 3. COMPARACIÓN CON TUS ROLES REALES (MySQL)
      // Usamos el nombre exacto que cargamos: 'Profesional' o 'Cliente'
      if (payload.rol === 'Profesional') {
        router.push('/disponibilidad');
      } else if (payload.rol === 'Cliente') {
        router.push('/mis-turnos');
      } else {
        // Por si acaso hay un rol 'Admin' u otro
        router.push('/'); 
      }
    } catch (decodeError) {
      console.error("Error al decodificar token:", decodeError);
      setServerError("Error en la sesión. Intenta de nuevo.");
    }

  } catch (err: any) {
    // Manejo de errores de servidor (tus credenciales inválidas)
    setServerError(err.response?.data?.message || 'Error al iniciar sesión');
  }
};

  return (
    <>
      <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl p-8 sm:p-10 border border-[var(--border)] shadow-[var(--shadow-lg)]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-light mb-1 leading-tight">
            Iniciar sesion
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Ingresa tus datos para acceder</p>
        </div>

        {serverError && (
          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm font-medium text-red-500 border border-red-500/25 bg-red-500/5"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col">
            <label
              htmlFor="email"
              className="text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              className={`w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none transition-all duration-200 border-[1.5px] ${
                errors.email
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15'
              }`}
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Ingresa un email valido',
                },
              })}
            />
            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none transition-all duration-200 border-[1.5px] ${
                errors.password
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15'
              }`}
              {...register('password', { required: 'La contrasena es obligatoria' })}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-1 py-3 px-6 rounded-xl text-[0.9375rem] font-semibold text-white cursor-pointer transition-opacity duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'var(--gradient-cta)', boxShadow: 'var(--shadow-md)' }}
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          No tenes cuenta?{' '}
          <button
            onClick={() => onSwitch('register')}
            className="font-semibold text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors duration-150 cursor-pointer bg-none border-none"
          >
            Registrate
          </button>
        </p>
        <button
          onClick={() => onSwitch('home')}
          className="mt-4 w-full py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150 bg-none border-none cursor-pointer"
        >
          Volver a inicio
        </button>
      </div>
    </>
  );
}
