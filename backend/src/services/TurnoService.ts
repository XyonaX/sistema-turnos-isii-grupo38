import { AppDataSource } from '../config/database';
import { Turno, EstadoTurno } from '../entities/Turno';
import { Horario } from '../entities/Horario';
import { Usuario } from '../entities/Usuario';

// Campos del cliente que se exponen en respuestas — excluye passwordHash
const CLIENTE_SELECT = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
} as const;

// Relations con select explícito para todos los métodos que devuelven turnos
const TURNO_RELATIONS = {
  relations: { cliente: true, horario: true },
  select: {
    id: true,
    estado: true,
    notas: true,
    creadoEn: true,
    cliente: CLIENTE_SELECT,
    horario: {
      id: true,
      fecha: true,
      horaInicio: true,
      horaFin: true,
      disponible: true,
    },
  },
} as const;

export class TurnoService {
  private turnoRepo = AppDataSource.getRepository(Turno);
  private horarioRepo = AppDataSource.getRepository(Horario);
  private usuarioRepo = AppDataSource.getRepository(Usuario);

  async reservar(clienteId: string, horarioId: string, notas?: string): Promise<Turno> {
    const horario = await this.horarioRepo.findOneBy({ id: horarioId, disponible: true });
    if (!horario) throw new Error('Horario no disponible');

    const existing = await this.turnoRepo.findOneBy({
      horario: { id: horarioId },
      estado: EstadoTurno.PENDIENTE,
    });
    if (existing) throw new Error('El horario ya está reservado');

    const cliente = await this.usuarioRepo.findOneBy({ id: clienteId });
    if (!cliente) throw new Error('Cliente no encontrado');

    const turno = this.turnoRepo.create({ cliente, horario, notas, estado: EstadoTurno.PENDIENTE });
    const saved = await this.turnoRepo.save(turno);

    // Recargar con select seguro para no devolver passwordHash
    return this.turnoRepo.findOneOrFail({
      where: { id: saved.id },
      ...TURNO_RELATIONS,
    });
  }

  async getMisTurnos(clienteId: string): Promise<Turno[]> {
    return this.turnoRepo.find({
      where: { cliente: { id: clienteId } },
      order: { creadoEn: 'DESC' },
      ...TURNO_RELATIONS,
    });
  }

  async cancelar(turnoId: string, clienteId?: string): Promise<Turno> {
    const where = clienteId
      ? { id: turnoId, cliente: { id: clienteId } }
      : { id: turnoId };

    const turno = await this.turnoRepo.findOne({ where });
    if (!turno) throw new Error('Turno no encontrado');
    if (turno.estado === EstadoTurno.CANCELADO) throw new Error('El turno ya está cancelado');

    turno.estado = EstadoTurno.CANCELADO;
    const saved = await this.turnoRepo.save(turno);

    return this.turnoRepo.findOneOrFail({
      where: { id: saved.id },
      ...TURNO_RELATIONS,
    });
  }

  async getTodos(): Promise<Turno[]> {
    return this.turnoRepo.find({
      order: { creadoEn: 'DESC' },
      ...TURNO_RELATIONS,
    });
  }
}
