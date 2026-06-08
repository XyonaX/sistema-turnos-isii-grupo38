import { AppDataSource } from '../config/database';
import { FranjaHoraria } from '../entities/FranjaHoraria';
import { Turno } from '../entities/Turno';
import { Notificacion } from '../entities/Notificacion';
import { ESTADO_FRANJA, ESTADO_TURNO, TIPO_NOTIFICACION } from '../constants/catalog';
import {
  getEstadoFranjaId,
  getEstadoTurnoId,
  getTipoNotificacionId,
} from '../repositories/catalogRepository';
import { gestorPago } from './GestorPago';

const TURNO_RELATIONS = {
  relations: {
    cliente: true,
    franja: { horario: { servicio: { profesional: true } }, estadoFranja: true },
    estadoTurno: true,
    notificaciones: { tipoNotificacion: true },
  },
} as const;

export class TurnoService {
  private turnoRepo = AppDataSource.getRepository(Turno);
  private franjaRepo = AppDataSource.getRepository(FranjaHoraria);
  private notificacionRepo = AppDataSource.getRepository(Notificacion);

  /**
   * Reserva una franja con lock pesimista para evitar doble reserva concurrente.
   * El pago se inicia después del commit para no bloquear la transacción principal.
   */
  async reservar(
    clienteId: string,
    franjaId: string,
    notas?: string
  ): Promise<{ turno: Turno; pagoId: string; plazoExpiracion: Date }> {
    const estadoLibreId = await getEstadoFranjaId(ESTADO_FRANJA.LIBRE);
    const estadoOcupadaId = await getEstadoFranjaId(ESTADO_FRANJA.OCUPADA);
    const estadoPendienteId = await getEstadoTurnoId(ESTADO_TURNO.PENDIENTE);
    const tipoConfirmacionId = await getTipoNotificacionId(TIPO_NOTIFICACION.CONFIRMACION);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const franja = await queryRunner.manager.findOne(FranjaHoraria, {
        where: { id: franjaId },
        relations: { estadoFranja: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!franja) {
        throw new Error('Franja horaria no encontrada');
      }

      if (franja.estadoFranja.id !== estadoLibreId) {
        throw new Error('Franja horaria no disponible');
      }

      const turno = queryRunner.manager.create(Turno, {
        cliente: { id: clienteId },
        franja: { id: franjaId },
        estadoTurno: { id: estadoPendienteId },
        notas,
        pagoPendiente: true,
      });

      const savedTurno = await queryRunner.manager.save(turno);

      franja.estadoFranja = { id: estadoOcupadaId } as any;
      await queryRunner.manager.save(franja);

      const notificacion = queryRunner.manager.create(Notificacion, {
        turno: { id: savedTurno.id },
        tipoNotificacion: { id: tipoConfirmacionId },
        mensaje: 'Turno reservado correctamente',
        leida: false,
      });
      await queryRunner.manager.save(notificacion);

      await queryRunner.commitTransaction();

      const turnoGuardado = await this.turnoRepo.findOneOrFail({
        where: { id: savedTurno.id },
        ...TURNO_RELATIONS,
      });

      // Iniciar sesión de pago fuera de la transacción principal
      const { pagoId, plazoExpiracion } = await gestorPago.iniciarPago(savedTurno.id);

      return { turno: turnoGuardado, pagoId, plazoExpiracion };
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

  // Se llama antes de devolver los turnos al cliente para que el estado refleje la realidad
  private async actualizarTurnosCompletados(): Promise<void> {
    const ahora = new Date();
    const estadoCompletadoId = await getEstadoTurnoId(ESTADO_TURNO.COMPLETADO);

    const turnosPendientes = await this.turnoRepo.find({
      where: [
        { estadoTurno: { nombre: ESTADO_TURNO.PENDIENTE } },
        { estadoTurno: { nombre: ESTADO_TURNO.CONFIRMADO } },
      ],
      relations: { franja: true, estadoTurno: true },
    });

    for (const turno of turnosPendientes) {
      if (!turno.franja) continue;
      const [horas, minutos] = turno.franja.horaFin.split(':').map(Number);
      const fechaStr: string =
        typeof turno.franja.fecha === 'string'
          ? turno.franja.fecha
          : (turno.franja.fecha as unknown as Date).toISOString().substring(0, 10);
      const [year, month, day] = fechaStr.substring(0, 10).split('-').map(Number);
      const fechaTurno = new Date(year, month - 1, day, horas, minutos, 0, 0);

      if (fechaTurno < ahora) {
        turno.estadoTurno = { id: estadoCompletadoId } as any;
        await this.turnoRepo.save(turno);
      }
    }
  }

  /**
   * Los clientes solo pueden cancelar con al menos 3 horas de anticipación.
   * Guardamos fecha/hora de la franja antes de nullificarla para no perder el historial.
   */
  async cancelar(turnoId: string, clienteId?: string): Promise<Turno> {
    const estadoCanceladoId = await getEstadoTurnoId(ESTADO_TURNO.CANCELADO);
    const estadoLibreId = await getEstadoFranjaId(ESTADO_FRANJA.LIBRE);
    const tipoCancelacionId = await getTipoNotificacionId(TIPO_NOTIFICACION.CANCELACION);

    const turno = await this.turnoRepo.findOne({
      where: clienteId ? { id: turnoId, cliente: { id: clienteId } } : { id: turnoId },
      ...TURNO_RELATIONS,
    });

    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    if (turno.estadoTurno.nombre === ESTADO_TURNO.CANCELADO) {
      throw new Error('El turno ya está cancelado');
    }

    if (clienteId) {
      const fechaRaw = turno.franja?.fecha;
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

    turno.estadoTurno = { id: estadoCanceladoId } as any;
    // Snapshot de los datos de la franja antes de romper la relación
    turno.franjaFecha = turno.franja?.fecha ?? undefined;
    turno.franjaHoraInicio = turno.franja?.horaInicio ?? undefined;
    turno.franjaHoraFin = turno.franja?.horaFin ?? undefined;
    turno.franja = null;
    await this.turnoRepo.save(turno);
    // TypeORM a veces no persiste el NULL en relaciones @OneToOne; el UPDATE directo lo garantiza
    await AppDataSource.query('UPDATE turnos SET franjaId = NULL WHERE id = ?', [turno.id]);

    if (franjaId) {
      await this.franjaRepo.update(
        { id: franjaId },
        { estadoFranja: { id: estadoLibreId } as any }
      );
    }

    const notificacion = this.notificacionRepo.create({
      turno: { id: turnoId },
      tipoNotificacion: { id: tipoCancelacionId },
      mensaje: 'Turno cancelado',
      leida: false,
    });
    await this.notificacionRepo.save(notificacion);

    return this.turnoRepo.findOneOrFail({
      where: { id: turno.id },
      ...TURNO_RELATIONS,
    });
  }

  // El profesional puede cancelar en cualquier momento — no aplica la restricción de 3 horas
  async cancelarProfesional(turnoId: string, profesionalId: string): Promise<Turno> {
    const estadoCanceladoId = await getEstadoTurnoId(ESTADO_TURNO.CANCELADO);
    const estadoLibreId = await getEstadoFranjaId(ESTADO_FRANJA.LIBRE);
    const tipoCancelacionId = await getTipoNotificacionId(TIPO_NOTIFICACION.CANCELACION);

    const turno = await this.turnoRepo.findOne({
      where: { id: turnoId },
      ...TURNO_RELATIONS,
    });

    if (!turno) {
      throw new Error('Turno no encontrado');
    }

    if (turno.franja?.horario?.servicio?.profesional?.id !== profesionalId) {
      throw new Error('No tenés permiso para cancelar este turno');
    }

    if (turno.estadoTurno.nombre === ESTADO_TURNO.CANCELADO) {
      throw new Error('El turno ya está cancelado');
    }

    const franjaId = turno.franja!.id;

    turno.estadoTurno = { id: estadoCanceladoId } as any;
    turno.franjaFecha = turno.franja?.fecha ?? undefined;
    turno.franjaHoraInicio = turno.franja?.horaInicio ?? undefined;
    turno.franjaHoraFin = turno.franja?.horaFin ?? undefined;
    turno.franja = null;
    await this.turnoRepo.save(turno);
    // Mismo workaround que en cancelar() — forzar NULL vía SQL directo
    await AppDataSource.query('UPDATE turnos SET franjaId = NULL WHERE id = ?', [turno.id]);

    await this.franjaRepo.update({ id: franjaId }, { estadoFranja: { id: estadoLibreId } as any });

    const notificacion = this.notificacionRepo.create({
      turno: { id: turnoId },
      tipoNotificacion: { id: tipoCancelacionId },
      mensaje: 'Turno cancelado por el profesional',
      leida: false,
    });
    await this.notificacionRepo.save(notificacion);

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
      .leftJoinAndSelect('franja.estadoFranja', 'estadoFranja')
      .leftJoinAndSelect('franja.horario', 'horario')
      .leftJoinAndSelect('horario.servicio', 'servicio')
      .leftJoinAndSelect('servicio.profesional', 'profesional')
      .leftJoinAndSelect('turno.cliente', 'cliente')
      .leftJoinAndSelect('turno.estadoTurno', 'estadoTurno')
      .where('profesional.id = :profesionalId', { profesionalId })
      .orderBy('franja.fecha', 'DESC')
      .addOrderBy('franja.horaInicio', 'ASC')
      .getMany();
  }

  async getTurnosByCliente(clienteId: string): Promise<Turno[]> {
    return this.turnoRepo.find({
      where: { cliente: { id: clienteId } },
      ...TURNO_RELATIONS,
    });
  }

  async getTurnoById(id: string): Promise<Turno> {
    const turno = await this.turnoRepo.findOne({
      where: { id },
      ...TURNO_RELATIONS,
    });
    if (!turno) throw new Error('Turno no encontrado');
    return turno;
  }
}
