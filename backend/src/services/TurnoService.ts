import { AppDataSource } from '../config/database';
import { FranjaHoraria } from '../entities/FranjaHoraria';
import { Turno, EstadoTurno } from '../entities/Turno';
import { Usuario } from '../entities/Usuario';

// Relations para todos los métodos que devuelven turnos
// passwordHash tiene select:false en la entidad, no se expone automáticamente
const TURNO_RELATIONS = {
  relations: {
    cliente: true,
    franja: { horario: true },
  },
} as const;

export class TurnoService {
  private turnoRepo = AppDataSource.getRepository(Turno);
  private franjaRepo = AppDataSource.getRepository(FranjaHoraria);

  async reservar(clienteId: string, franjaId: string, notas?: string): Promise<Turno> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener la franja con lock para evitar condiciones de carrera
      const franja = await queryRunner.manager.findOne(FranjaHoraria, {
        where: { id: franjaId, disponible: true },
      });

      if (!franja) {
        throw new Error('Franja horaria no disponible o no encontrada');
      }

      // Verificar que el usuario existe
      const cliente = await queryRunner.manager.findOne(Usuario, {
        where: { id: clienteId },
      });

      if (!cliente) {
        throw new Error('Usuario no encontrado');
      }

      // Buscar cualquier turno existente para esta franja (incluye cancelados)
      const existingTurno = await queryRunner.manager.findOne(Turno, {
        where: { franja: { id: franjaId } },
      });

      if (existingTurno) {
        if (
          existingTurno.estado === EstadoTurno.PENDIENTE ||
          existingTurno.estado === EstadoTurno.CONFIRMADO
        ) {
          throw new Error('Este horario ya fue reservado por otro usuario');
        }
        // Reutilizar el turno cancelado/completado para evitar el UNIQUE constraint
        existingTurno.cliente = cliente;
        existingTurno.estado = EstadoTurno.PENDIENTE;
        existingTurno.notas = notas ?? undefined;
        await queryRunner.manager.save(existingTurno);
        await queryRunner.manager.update(FranjaHoraria, { id: franjaId }, { disponible: false });
        await queryRunner.commitTransaction();

        return this.turnoRepo.findOneOrFail({
          where: { id: existingTurno.id },
          ...TURNO_RELATIONS,
        });
      }

      // No hay turno previo — crear uno nuevo || Agendar el turno y marcar la franja como no disponible
      await queryRunner.manager.update(FranjaHoraria, { id: franjaId }, { disponible: false });

      const turno = queryRunner.manager.create(Turno, {
        cliente,
        franja,
        notas,
        estado: EstadoTurno.PENDIENTE,
      });

      await queryRunner.manager.save(turno);
      await queryRunner.commitTransaction();

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
    await this.actualizarTurnosCompletados();

    return this.turnoRepo.find({
      where: { cliente: { id: clienteId } },
      order: { creadoEn: 'ASC' },
      ...TURNO_RELATIONS,
    });
  }

  private async actualizarTurnosCompletados(): Promise<void> {
    const ahora = new Date();

    const turnosPendientes = await this.turnoRepo.find({
      where: { estado: EstadoTurno.PENDIENTE },
      relations: { franja: { horario: true } },
    });

    for (const turno of turnosPendientes) {
      //Pendiente turnos siempre tienen franja, pero se verifica por seguridad
      if (!turno.franja?.horario) continue;
      const [horas, minutos] = turno.franja.horaFin.split(':').map(Number);
      // new Date('YYYY-MM-DD') parses as UTC midnight, which in UTC-3 shifts the date
      /*nuevo Date('YYYY-MM-DD') se parsea como medianoche UTC, lo que en UTC-3 desplaza la fecha. Para evitar esto
      se reconstruye la fecha usando el constructor de partes de fecha, que interpreta los valores en la zona horaria local. Esto asegura que la comparación con "ahora" sea correcta incluso en zonas horarias con UTC-3.*/
      // Se resta un día porque el horario de fin de la franja es exclusivo. Por ejemplo, si la franja es de 14:00 a 15:00, el turno se considera completado a las 15:00, no a las 14:00.
      const fechaStr: string =
        typeof turno.franja.horario.fecha === 'string'
          ? turno.franja.horario.fecha
          : (turno.franja.horario.fecha as unknown as Date).toISOString().substring(0, 10);
      const [year, month, day] = fechaStr.substring(0, 10).split('-').map(Number);
      const fechaTurno = new Date(year, month - 1, day, horas, minutos, 0, 0);

      if (fechaTurno < ahora) {
        turno.estado = EstadoTurno.COMPLETADO;
        await this.turnoRepo.save(turno);
      }
    }
  }

  async cancelar(turnoId: string, clienteId?: string): Promise<Turno> {
    const where = clienteId ? { id: turnoId, cliente: { id: clienteId } } : { id: turnoId };

    const turno = await this.turnoRepo.findOne({
      where,
      relations: { franja: { horario: true } },
    });

    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    if (turno.estado === EstadoTurno.CANCELADO) {
      throw new Error('El turno ya está cancelado');
    }

    // Los clientes solo pueden cancelar con al menos 3 horas de anticipación
    if (clienteId) {
      const fechaRaw = turno.franja?.horario?.fecha;
      const horaInicio = turno.franja?.horaInicio;
      if (fechaRaw && horaInicio) {
        const [h, m] = horaInicio.split(':').map(Number);
        const fechaStr: string =
          typeof fechaRaw === 'string'
            ? fechaRaw
            : (fechaRaw as unknown as Date).toISOString().substring(0, 10);
        const [year, month, day] = fechaStr.substring(0, 10).split('-').map(Number);
        const turnoDate = new Date(year, month - 1, day, h, m, 0, 0);
        const diffMs = turnoDate.getTime() - Date.now();
        if (diffMs < 3 * 60 * 60 * 1000) {
          throw new Error('No se puede cancelar el turno con menos de 3 horas de anticipación');
        }
      }
    }

    const franjaId = turno.franja?.id;

    turno.estado = EstadoTurno.CANCELADO;
    await this.turnoRepo.save(turno);

    if (franjaId) {
      await this.franjaRepo.update({ id: franjaId }, { disponible: true });
    }

    return this.turnoRepo.findOneOrFail({
      where: { id: turno.id },
      ...TURNO_RELATIONS,
    });
  }

  async cancelarProfesional(turnoId: string, profesionalId: string): Promise<Turno> {
    const turno = await this.turnoRepo.findOne({
      where: { id: turnoId },
      relations: { franja: { horario: { servicio: { profesional: true } } } },
    });

    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    if (turno.franja?.horario?.servicio?.profesional?.id !== profesionalId) {
      throw new Error('No tenés permiso para cancelar este turno');
    }

    if (turno.estado === EstadoTurno.CANCELADO) {
      throw new Error('El turno ya está cancelado');
    }

    const franjaId = turno.franja!.id;

    turno.estado = EstadoTurno.CANCELADO;
    await this.turnoRepo.save(turno);
    await this.franjaRepo.update({ id: franjaId }, { disponible: true });

    return this.turnoRepo.findOneOrFail({
      where: { id: turno.id },
      ...TURNO_RELATIONS,
    });
  }

  async getTodos(): Promise<Turno[]> {
    return this.turnoRepo.find({
      order: { creadoEn: 'DESC' },
      ...TURNO_RELATIONS,
    });
  }

  async getTurnosByProfesional(profesionalId: string): Promise<Turno[]> {
    return this.turnoRepo
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.franja', 'franja')
      .leftJoinAndSelect('franja.horario', 'horario')
      .leftJoinAndSelect('horario.servicio', 'servicio')
      .leftJoinAndSelect('servicio.profesional', 'profesional')
      .leftJoinAndSelect('turno.cliente', 'cliente')
      .where('profesional.id = :profesionalId', { profesionalId })
      .orderBy('horario.fecha', 'DESC')
      .addOrderBy('franja.horaInicio', 'ASC')
      .getMany();
  }
}
