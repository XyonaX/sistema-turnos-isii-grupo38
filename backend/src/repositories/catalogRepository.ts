import { AppDataSource } from '../config/database';
import { EstadoFranja } from '../entities/EstadoFranja';
import { EstadoTurno } from '../entities/EstadoTurno';


// In-memory cache so catalog lookups only hit DB once per process lifetime
const cache: Record<string, string> = {};

async function getIdByNombre(entityClass: any, tableName: string, nombre: string): Promise<string> {
  const key = `${tableName}:${nombre}`;
  if (cache[key]) return cache[key];
  const repo = AppDataSource.getRepository(entityClass);
  const entity = await repo.findOneBy({ nombre });
  if (!entity) throw new Error(`Catálogo '${nombre}' no encontrado en ${tableName}`);
  cache[key] = entity.id;
  return entity.id;
}

export async function getEstadoFranjaId(nombre: string): Promise<string> {
  return getIdByNombre(EstadoFranja, 'estados_franja', nombre);
}

export async function getEstadoTurnoId(nombre: string): Promise<string> {
  return getIdByNombre(EstadoTurno, 'estados_turno', nombre);
}

