'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/mis-turnos');
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    try {
      await authService.login(data.email, data.password);
      router.push('/mis-turnos');
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
      ) {
        const msg = (err.response.data as { message: string }).message;
        setServerError(msg);
      } else {
        setServerError('Credenciales invalidas. Verifica tu email y contrasena.');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl p-8 sm:p-10 border border-[var(--border)] shadow-[var(--shadow-lg)]">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary-light mb-1 leading-tight">
              Iniciar sesion
            </h1>
            <p className="text-sm text-[var(--text-muted)]">Ingresa tus datos para acceder</p>
          </div>

          {/* Server error */}
          {serverError && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium text-red-500 border border-red-500/25 bg-red-500/5"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {/* Email */}
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
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
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
                {...register('password', {
                  required: 'La contrasena es obligatoria',
                })}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1 py-3 px-6 rounded-xl text-[0.9375rem] font-semibold text-white cursor-pointer transition-opacity duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'var(--gradient-cta)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            No tenes cuenta?{' '}
            <Link
              href="/register"
              className="font-semibold text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors duration-150"
            >
              Registrate
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
