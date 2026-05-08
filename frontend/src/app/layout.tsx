import type { Metadata } from 'next';

import './globals.css';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'TurnoFácil — Sistema de Gestión de Turnos',
  description:
    'Reservá turnos online de manera fácil, rápida y segura. Gestioná tu agenda sin complicaciones.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'dark' || stored === 'light') {
                    document.documentElement.setAttribute('data-theme', stored);
                  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <main className="flex-grow">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
