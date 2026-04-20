'use client';
import Link from 'next/link';
import styles from '../app/page.module.css';

function IconShield({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6L12 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="3" fill="white" fillOpacity="0.9" />
      <path d="M3 9h18" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="9" cy="14" r="1.5" fill="#0891B2" />
      <circle cx="12" cy="14" r="1.5" fill="#059669" />
      <circle cx="15" cy="14" r="1.5" fill="#0891B2" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.footerBrandName}>
              <span
                className={styles.navLogo}
                style={{ width: 32, height: 32 }}
                aria-hidden="true"
              >
                <IconLogo size={18} />
              </span>
              Turno<span>Fácil</span>
            </div>
            <p className={styles.footerBrandDesc}>
              Sistema de gestión de turnos diseñado para simplificar la reserva y administración
              de citas. Proyecto ISII — Grupo 38.
            </p>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Acceso</h4>
            <ul className={styles.footerLinks}>
              <li>
                <Link href="/login">Iniciar sesión</Link>
              </li>
              <li>
                <Link href="/register">Registrarse</Link>
              </li>
              <li>
                <Link href="/disponibilidad">Ver disponibilidad</Link>
              </li>
              <li>
                <Link href="/mis-turnos">Mis turnos</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Sistema</h4>
            <ul className={styles.footerLinks}>
              <li>
                <a href="#funcionalidades">Funcionalidades</a>
              </li>
              <li>
                <a href="#como-funciona">Cómo funciona</a>
              </li>
              <li>
                <Link href="/admin">Panel admin</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerCopy}>
            &copy; {new Date().getFullYear()} TurnoFácil &mdash; Proyecto ISII Grupo 38.
            Desarrollado con Next.js &amp; React.
          </p>
          <span className={styles.footerBadge}>
            <IconShield size={12} />
            ISII &mdash; Grupo 38
          </span>
        </div>
      </div>
    </footer>
  );
}
