import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { globalLimiter } from './middlewares/rateLimiter';
import authRoutes from './routes/auth.routes';
import turnoRoutes from './routes/turno.routes';
import horarioRoutes from './routes/horario.routes';
import servicioRoutes from './routes/servicio.routes';
import setupRoutes from './routes/setup.routes';

dotenv.config();

// Validar variables de entorno requeridas al iniciar
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET no está definido en las variables de entorno');
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use('/api', globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/servicios', servicioRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

AppDataSource.initialize()
  .then(() => {
    console.log('Base de datos conectada');
    app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Error conectando a la base de datos:', err);
    process.exit(1);
  });
