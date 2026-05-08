import Link from 'next/link';

import { ThemeToggle } from '../components/ThemeToggle';

import styles from './page.module.css';

/* ── SVG Icon helpers (inline, no emoji) ── */
function IconCalendar({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="14" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <circle cx="15" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

function IconClock({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7v5l3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function IconSettings({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconArrow({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
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

/* ── Data ── */
const features = [
  {
    icon: <IconCalendar size={26} />,
    title: 'Reservá fácilmente',
    desc: 'Seleccioná el día y horario que más te convenga. Proceso claro y sin pasos innecesarios.',
  },
  {
    icon: <IconClock size={26} />,
    title: 'Gestioná tus turnos',
    desc: 'Consultá, modificá o cancelá tus turnos desde cualquier dispositivo, en cualquier momento.',
  },
  {
    icon: <IconCalendar size={26} />,
    title: 'Vista de calendario',
    desc: 'Visualizá la disponibilidad en tiempo real con un calendario claro e intuitivo.',
  },
  {
    icon: <IconSettings size={26} />,
    title: 'Panel de administración',
    desc: 'Herramientas completas para gestionar usuarios, horarios y disponibilidad.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Creá tu cuenta',
    desc: 'Registrate en segundos con tu nombre y correo. Sin datos innecesarios ni pasos complicados.',
  },
  {
    number: '02',
    title: 'Elegí fecha y hora',
    desc: 'Explorá los horarios disponibles en el calendario y seleccioná el que mejor se adapte.',
  },
  {
    number: '03',
    title: 'Confirmá y listo',
    desc: 'Tu turno queda registrado al instante. Podés ver y gestionar todos tus turnos desde tu perfil.',
  },
];

/* ── Page Component ── */
export default function Home() {
  return (
    <>
      {/* ─── Navbar ─────────────────────────────── */}
      <header role="banner">
        <nav className={styles.navbar} aria-label="Navegación principal">
          <Link href="/" className={styles.navBrand} aria-label="TurnoFácil — Inicio">
            <span className={styles.navLogo} aria-hidden="true">
              <IconLogo />
            </span>
            <span className={styles.navBrandName}>
              Turno<span>Fácil</span>
            </span>
          </Link>

          <div className={styles.navLinks} role="navigation">
            <a href="#funcionalidades" className={styles.navLink}>
              Funcionalidades
            </a>
            <a href="#como-funciona" className={styles.navLink}>
              Cómo funciona
            </a>
          </div>

          <div className={styles.navActions}>
            <ThemeToggle />
            <Link href="/login" className={styles.navLoginBtn}>
              Iniciar sesión
            </Link>
            <Link href="/register" className={styles.navRegisterBtn}>
              Registrarse
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* ─── Hero ─────────────────────────────── */}
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroBackground} aria-hidden="true" />
          <div className={styles.heroOrb1} aria-hidden="true" />
          <div className={styles.heroOrb2} aria-hidden="true" />
          <div className={styles.heroOrb3} aria-hidden="true" />

          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} aria-hidden="true" />
              Sistema de turnos online
            </div>

            <h1 id="hero-title" className={styles.heroTitle}>
              Tu turno, a un <span className={styles.heroTitleHighlight}>clic de distancia</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Reservá, modificá y gestioná tus turnos de forma rápida y sencilla. Sin llamadas, sin
              esperas. Disponible las 24 horas.
            </p>

            <div className={styles.heroCta}>
              <Link href="/register" className={styles.btnPrimary}>
                Empezar gratis
                <IconArrow size={18} />
              </Link>
              <Link href="/mis-turnos" className={styles.btnSecondary}>
                Ver disponibilidad
                <IconCalendar size={18} />
              </Link>
            </div>

            <div className={styles.heroStats} aria-label="Estadísticas del sistema">
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>100%</span>
                <span className={styles.heroStatLabel}>Online</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>24/7</span>
                <span className={styles.heroStatLabel}>Disponible</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>0</span>
                <span className={styles.heroStatLabel}>Esperas por teléfono</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features ─────────────────────────── */}
        <section
          id="funcionalidades"
          className={`${styles.section} ${styles.sectionAlt}`}
          aria-labelledby="features-title"
        >
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>
                <IconCheck size={12} />
                Funcionalidades
              </span>
              <h2 id="features-title" className={styles.sectionTitle}>
                Todo lo que necesitás para gestionar tus turnos
              </h2>
              <p className={styles.sectionSubtitle}>
                Una plataforma diseñada para que tanto usuarios como administradores tengan una
                experiencia fluida y sin fricciones.
              </p>
            </div>

            <div className={styles.featuresGrid}>
              {features.map((f, i) => (
                <article key={i} className={styles.featureCard}>
                  <div className={styles.featureIconWrap} aria-hidden="true">
                    {f.icon}
                  </div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─────────────────────── */}
        <section id="como-funciona" className={styles.section} aria-labelledby="steps-title">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>
                <IconShield size={12} />
                Cómo funciona
              </span>
              <h2 id="steps-title" className={styles.sectionTitle}>
                Tres pasos, y ya tenés tu turno
              </h2>
              <p className={styles.sectionSubtitle}>
                Diseñado para ser lo más simple posible. Sin complicaciones, sin procesos
                interminables.
              </p>
            </div>

            <div className={styles.stepsGrid} role="list" aria-label="Pasos para reservar un turno">
              {steps.map((step, i) => (
                <div key={i} className={styles.stepCard} role="listitem">
                  <div className={styles.stepNumber} aria-hidden="true">
                    {step.number}
                  </div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ───────────────────────── */}
        <section className={styles.ctaBanner} aria-labelledby="cta-title">
          <div className={styles.ctaBannerInner}>
            <h2 id="cta-title" className={styles.ctaBannerTitle}>
              ¿Listo para gestionar tus turnos?
            </h2>
            <p className={styles.ctaBannerSubtitle}>
              Unite a quienes ya gestionan sus turnos de forma digital. Crear tu cuenta es gratuito
              y tarda menos de un minuto.
            </p>
            <div className={styles.ctaBannerActions}>
              <Link href="/register" className={styles.btnWhite}>
                Crear cuenta gratis
                <IconArrow size={18} />
              </Link>
              <Link href="/login" className={styles.btnOutlineWhite}>
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
