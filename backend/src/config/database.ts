import dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { FranjaHoraria } from '../entities/FranjaHoraria';
import { Horario } from '../entities/Horario';
import { Notificacion } from '../entities/Notificacion';
import { Rol } from '../entities/Rol';
import { Servicio } from '../entities/Servicio';
import { Turno } from '../entities/Turno';
import { Usuario } from '../entities/Usuario';
import { EstadoFranja } from '../entities/EstadoFranja';
import { EstadoTurno } from '../entities/EstadoTurno';
import { TipoNotificacion } from '../entities/TipoNotificacion';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'sistema_turnos',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Usuario, Turno, Horario, Rol, Servicio, FranjaHoraria, Notificacion, EstadoFranja, EstadoTurno, TipoNotificacion],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
