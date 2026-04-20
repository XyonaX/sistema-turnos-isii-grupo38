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
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener el horario con lock para evitar condiciones de carrera
      const horario = await queryRunner.manager.findOne(Horario, {
        where: { id: horarioId, disponible: true },
      });

      if (!horario) {
        throw new Error('Horario no disponible o no encontrado');
      }

      // Verificar si ya existe un turno pendiente para este horario
      const existing = await queryRunner.manager.findOne(Turno, {
        where: {
          horario: { id: horarioId },
          estado: EstadoTurno.PENDIENTE,
        },
      });

      if (existing) {
        throw new Error('Este horario ya fue reservado por otro usuario');
      }

      // Verificar que el usuario existe
      const cliente = await queryRunner.manager.findOne(Usuario, {
        where: { id: clienteId },
      });

      if (!cliente) {
        throw new Error('Usuario no encontrado');
      }

      // Marcar horario como no disponible
      horario.disponible = false;
      await queryRunner.manager.update(
        Horario,
        { id: horarioId },
        { disponible: false }
      );

      // Crear el turno
      const turno = queryRunner.manager.create(Turno, {
        cliente,
        horario,
        notas,
        estado: EstadoTurno.PENDIENTE,
      });

      await queryRunner.manager.save(turno);
      await queryRunner.commitTransaction();

      // Recargar con select seguro para no devolver passwordHash
      return this.turnoRepo.findOneOrFail({
        where: { id: turno.id },
        ...TURNO_RELATIONS,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getMisTurnos(clienteId: string): Promise<Turno[]> {
    // Actualizar turnos que hayan pasado de fecha a COMPLETADO
    await this.actualizarTurnosCompletados();

    return this.turnoRepo.find({
      where: { cliente: { id: clienteId } },
      order: { horario: { fecha: 'ASC', horaInicio: 'ASC' } },
      ...TURNO_RELATIONS,
    });
  }

  private async actualizarTurnosCompletados(): Promise<void> {
    const ahora = new Date();

    // Buscar turnos PENDIENTE que hayan pasado de fecha
    const turnosPendientes = await this.turnoRepo.find({
      where: { estado: EstadoTurno.PENDIENTE },
      relations: ['horario'],
    });

    for (const turno of turnosPendientes) {
      const [horas, minutos] = turno.horario.horaFin.split(':').map(Number);
      const fechaTurno = new Date(turno.horario.fecha);
      fechaTurno.setHours(horas, minutos, 0, 0);

      // Si la fecha+hora del turno ya pasó, marcar como COMPLETADO
      if (fechaTurno < ahora) {
        turno.estado = EstadoTurno.COMPLETADO;
        await this.turnoRepo.save(turno);
      }
    }
  }

  async cancelar(turnoId: string, clienteId?: string): Promise<Turno> {
    const where: any = clienteId
      ? { id: turnoId, cliente: { id: clienteId } }
      : { id: turnoId };

    const turno = await this.turnoRepo.findOne({
      where,
      relations: ['horario'],
    });

    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    if (turno.estado === EstadoTurno.CANCELADO) {
      throw new Error('El turno ya está cancelado');
    }

    turno.estado = EstadoTurno.CANCELADO;

    // Liberar el horario si existe
    if (turno.horario) {
      await this.horarioRepo.update(
        { id: turno.horario.id },
        { disponible: true }
      );
    }

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
