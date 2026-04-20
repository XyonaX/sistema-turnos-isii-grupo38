import { AppDataSource } from '../config/database';
import { Turno, EstadoTurno } from '../entities/Turno';
import { Horario } from '../entities/Horario';
import { Usuario } from '../entities/Usuario';

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

      // Recargar el turno con las relaciones completas
      return this.turnoRepo.findOne({
        where: { id: turno.id },
        relations: ['cliente', 'horario'],
      }) as Promise<Turno>;
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
      relations: ['cliente', 'horario'],
      order: { horario: { fecha: 'ASC', horaInicio: 'ASC' } },
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
    
    return this.turnoRepo.save(turno);
  }

  async getTodos(): Promise<Turno[]> {
    return this.turnoRepo.find({
      relations: ['cliente', 'horario'],
      order: { creadoEn: 'DESC' },
    });
  }
}
