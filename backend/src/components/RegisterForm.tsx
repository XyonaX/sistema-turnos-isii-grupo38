/// <reference types="react" />
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AuthService } from '../services/authService';

interface RegisterFormData {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export function RegisterForm({
  onSwitch,
}: {
  onSwitch: (mode: 'home' | 'login' | 'register') => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setSuccessMessage('');
    try {
      await AuthService.register(data.nombre, data.email, data.password, data.rol);
      setSuccessMessage('Registro exitoso. Redirigiendo...');

      // Pequeño delay para que se guarden los datos en localStorage
      setTimeout(() => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
            const payload = JSON.parse(atob(padded)) as any;
            const rol = payload.rol;

            if (rol === 'admin') {
              router.push('/admin');
            } else {
              router.push('/mis-turnos');
            }
          } catch {
            router.push('/mis-turnos');
          }
        }
      }, 0);
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
        setServerError('Error al registrarse. Intentalo de nuevo.');
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl p-8 sm:p-10 border border-[var(--border)] shadow-[var(--shadow-lg)]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1 leading-tight">
          Crear cuenta
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Completa los datos para registrarte</p>
      </div>

      {serverError && (
        <div
          className="mb-5 px-4 py-3 rounded-xl text-sm font-medium text-red-500 border border-red-500/25 bg-red-500/5"
          role="alert"
        >
          {serverError}
        </div>
      )}

      {successMessage && (
        <div
          className="mb-5 px-4 py-3 rounded-xl text-sm font-medium text-green-500 border border-green-500/25 bg-green-500/5"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col">
          <label
            htmlFor="nombre"
            className="text-sm font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre completo"
            className={`w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none transition-all duration-200 border-[1.5px] ${
              errors.nombre
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15'
            }`}
            {...register('nombre', {
              required: 'El nombre es obligatorio',
              minLength: { value: 2, message: 'Debe tener al menos 2 caracteres' },
            })}
          />
          {errors.nombre && <p className="mt-1.5 text-xs text-red-500">{errors.nombre.message}</p>}
        </div>

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
            autoComplete="new-password"
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none transition-all duration-200 border-[1.5px] ${
              errors.password
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15'
            }`}
            {...register('password', {
              required: 'La contrasena es obligatoria',
              minLength: { value: 6, message: 'Debe tener al menos 6 caracteres' },
            })}
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
          {isSubmitting ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Ya tenes cuenta?{' '}
        <button
          onClick={() => onSwitch('login')}
          className="font-semibold text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors duration-150 cursor-pointer bg-none border-none"
        >
          Inicia sesion
        </button>
      </p>
      <button
        onClick={() => onSwitch('home')}
        className="mt-4 w-full py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150 bg-none border-none cursor-pointer"
      >
        Volver a inicio
      </button>
    </div>
  );
}
