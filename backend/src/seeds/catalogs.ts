import { AppDataSource } from '../config/database';
import { Rol } from '../entities/Rol';
import { EstadoFranja } from '../entities/EstadoFranja';
import { EstadoTurno } from '../entities/EstadoTurno';


async function seedRoles(): Promise<void> {
  const repo = AppDataSource.getRepository(Rol);
  const roles = [
    { nombre: 'cliente', descripcion: 'Usuario que reserva turnos' },
    { nombre: 'profesional', descripcion: 'Usuario que ofrece servicios' },
  ];
  for (const data of roles) {
    const exists = await repo.findOneBy({ nombre: data.nombre });
    if (!exists) {
      await repo.save(repo.create(data));
    }
  }
}

async function seedEstadosFranja(): Promise<void> {
  const repo = AppDataSource.getRepository(EstadoFranja);
  const nombres = ['Libre', 'Ocupada', 'Bloqueada'];
  for (const nombre of nombres) {
    const exists = await repo.findOneBy({ nombre });
    if (!exists) {
      await repo.save(repo.create({ nombre }));
    }
  }
}

async function seedEstadosTurno(): Promise<void> {
  const repo = AppDataSource.getRepository(EstadoTurno);
  const nombres = ['Pendiente', 'Confirmado', 'Cancelado', 'Completado', 'No asistió'];
  for (const nombre of nombres) {
    const exists = await repo.findOneBy({ nombre });
    if (!exists) {
      await repo.save(repo.create({ nombre }));
    }
  }
}

export async function runSeeds(): Promise<void> {
  await seedRoles();
  await seedEstadosFranja();
  await seedEstadosTurno();
}
