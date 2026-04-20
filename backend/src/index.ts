import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';
import turnoRoutes from './routes/turno.routes';
import horarioRoutes from './routes/horario.routes';
import setupRoutes from './routes/setup.routes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/horarios', horarioRoutes);

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
