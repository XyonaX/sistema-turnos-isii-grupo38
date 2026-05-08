'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Navbar } from '../../components/Navbar';

export default function ProfesionalPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir al dashboard
    router.push('/profesional/dashboard');
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <Navbar />
      <main className="flex-1 px-4 py-12 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-center">
          <div className="animate-spin">
            <svg
              className="w-12 h-12 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}
