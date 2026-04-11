import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sistema de Turnos',
  description: 'Reservá turnos online de manera fácil y rápida',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
