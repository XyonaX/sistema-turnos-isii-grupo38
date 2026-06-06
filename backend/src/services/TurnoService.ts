// src/services/TurnoService.ts
import { AppDataSource } from '../config/database';
import { Turno as TurnoEntity } from '../entities/Turno';
import { FranjaHoraria as FranjaEntity } from '../entities/FranjaHoraria';
import { ESTADO_FRANJA, ESTADO_TURNO } from '../constants/catalog';
import {
  getEstadoFranjaId,
  getEstadoTurnoId,
} from '../repositories/catalogRepository';

// IMPORTAMOS TUS CLASES PURAS
import { Turno } from '../clases/Turno';
import { Usuario } from '../clases/Usuario';
import { Rol } from '../clases/Rol';

const TURNO_RELATIONS = {
  relations: {
    cliente: { rol: true },
    franja: { horario: { servicio: { profesional: true } }, estadoFranja: true },
    estadoTurno: true,
  },
} as const;

export class TurnoService {
  private turnoRepo = AppDataSource.getRepository(TurnoEntity);

  // =========================================================================
  // HELPER: Convierte una Entity de TypeORM en tu Clase Pura de Dominio
  // =========================================================================
  private mapearAClaseDominio(entity: TurnoEntity): Turno {
    const rolDominio = new Rol(
      entity.cliente?.rol?.nombre || '',
      entity.cliente?.rol?.descripcion || '',
      entity.cliente?.rol?.id
    );

    const usuarioDominio = new Usuario(
      entity.cliente?.nombre || '',
      entity.cliente?.email || '',
      '', 
      rolDominio,
      entity.cliente?.id
    );

    return new Turno(
      usuarioDominio,
      entity.estadoTurno?.nombre || '',
      entity.notas,
      entity.creadoEn,
      entity.id
    );
  }

  // =========================================================================
  // MÉTODOS DEL SERVICIO
  // =========================================================================

  async reservar(clienteId: string, franjaId: string, notas?: string): Promise<TurnoEntity> {
    const estadoLibreId = await getEstadoFranjaId(ESTADO_FRANJA.LIBRE);
    const estadoOcupadaId = await getEstadoFranjaId(ESTADO_FRANJA.OCUPADA);
    const estadoPendienteId = await getEstadoTurnoId(ESTADO_TURNO.PENDIENTE);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const franja = await queryRunner.manager.findOne(FranjaEntity, {
        where: { id: franjaId },
        relations: { estadoFranja: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!franja) throw new Error('Franja horaria no encontrada');
      if (franja.estadoFranja.id !== estadoLibreId) throw new Error('Franja horaria no disponible');

      const turno = queryRunner.manager.create(TurnoEntity, {
        cliente: { id: clienteId },
        franja: { id: franjaId },
        estadoTurno: { id: estadoPendienteId },
        notas,
      });

      const savedTurno = await queryRunner.manager.save(turno);

      franja.estadoFranja = { id: estadoOcupadaId } as any;
      await queryRunner.manager.save(franja);

      await queryRunner.commitTransaction();

      return this.turnoRepo.findOneOrFail({
        where: { id: savedTurno.id },
        ...TURNO_RELATIONS,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getMisTurnos(clienteId: string): Promise<TurnoEntity[]> {
    await this.actualizarTurnosCompletados();
    return this.turnoRepo.find({
      where: { cliente: { id: clienteId } },
      order: { creadoEn: 'ASC' },
      ...TURNO_RELATIONS,
    });
  }

  async cancelar(turnoId: string, clienteId?: string): Promise<TurnoEntity> {
    const turnoEntity = await this.turnoRepo.findOne({
      where: clienteId ? { id: turnoId, cliente: { id: clienteId } } : { id: turnoId },
      ...TURNO_RELATIONS,
    });

    if (!turnoEntity) throw new Error('Turno no encontrado');

    // Regla de anticipación de tiempo mínima para cancelar
    if (clienteId && turnoEntity.franja?.fecha && turnoEntity.franja?.horaInicio) {
      const [h, m] = turnoEntity.franja.horaInicio.split(':').map(Number);
      const fechaStr = typeof turnoEntity.franja.fecha === 'string' 
        ? turnoEntity.franja.fecha 
        : (turnoEntity.franja.fecha as any).toISOString().substring(0, 10);
      const [year, month, day] = fechaStr.split('-').map(Number);
      const turnoDate = new Date(year, month - 1, day, h, m);
      
      if (turnoDate.getTime() - Date.now() < 3 * 60 * 60 * 1000) {
        throw new Error('No se puede cancelar el turno con menos de 3 horas de anticipación');
      }
    }

    // INTERACCIÓN CON EL DOMINIO
    const turnoDominio = this.mapearAClaseDominio(turnoEntity);
    turnoDominio.cancelar(clienteId ? 'Cliente' : 'Profesional');

    // PERSISTENCIA
    turnoEntity.notas = turnoDominio.obtenerNotas();
    const nuevoEstadoId = await getEstadoTurnoId(turnoDominio.obtenerNombreEstado());
    turnoEntity.estadoTurno = { id: nuevoEstadoId } as any;

    await this.turnoRepo.save(turnoEntity);

    return this.turnoRepo.findOneOrFail({ where: { id: turnoEntity.id }, ...TURNO_RELATIONS });
  }

  async cancelarProfesional(turnoId: string, profesionalId: string): Promise<TurnoEntity> {
    const turnoEntity = await this.turnoRepo.findOne({
      where: { id: turnoId },
      ...TURNO_RELATIONS,
    });

    if (!turnoEntity) throw new Error('Turno no encontrado');

    if (turnoEntity.franja?.horario?.servicio?.profesional?.id !== profesionalId) {
      throw new Error('No tenés permiso para cancelar este turno');
    }

    // INTERACCIÓN CON EL DOMINIO
    const turnoDominio = this.mapearAClaseDominio(turnoEntity);
    turnoDominio.cancelar('Profesional');

    // PERSISTENCIA
    turnoEntity.notas = turnoDominio.obtenerNotas();
    const nuevoEstadoId = await getEstadoTurnoId(turnoDominio.obtenerNombreEstado());
    turnoEntity.estadoTurno = { id: nuevoEstadoId } as any;
    await this.turnoRepo.save(turnoEntity);

    return this.turnoRepo.findOneOrFail({ where: { id: turnoEntity.id }, ...TURNO_RELATIONS });
  }

  async getTodos(): Promise<TurnoEntity[]> {
    return this.turnoRepo.find({
      order: { creadoEn: 'DESC' },
      ...TURNO_RELATIONS,
    });
  }

  async getTurnosByProfesional(profesionalId: string): Promise<TurnoEntity[]> {
    return this.turnoRepo
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.franja', 'franja')
      .leftJoinAndSelect('franja.estadoFranja', 'estadoFranja')
      .leftJoinAndSelect('franja.horario', 'horario')
      .leftJoinAndSelect('horario.servicio', 'servicio')
      .leftJoinAndSelect('servicio.profesional', 'profesional')
      .leftJoinAndSelect('turno.cliente', 'cliente')
      .leftJoinAndSelect('cliente.rol', 'rol')
      .leftJoinAndSelect('turno.estadoTurno', 'estadoTurno')
      .where('profesional.id = :profesionalId', { profesionalId })
      .orderBy('franja.fecha', 'DESC')
      .addOrderBy('franja.horaInicio', 'ASC')
      .getMany();
  }

  // LÓGICA AUTOMÁTICA EN SEGUNDO PLANO
  private async actualizarTurnosCompletados(): Promise<void> {
    const ahora = new Date();

    const turnosAValidad = await this.turnoRepo.find({
      where: [
        { estadoTurno: { nombre: ESTADO_TURNO.PENDIENTE } },
        { estadoTurno: { nombre: ESTADO_TURNO.CONFIRMADO } },
      ],
      relations: { franja: true, estadoTurno: true, cliente: { rol: true } },
    });

    for (const entity of turnosAValidad) {
      if (!entity.franja) continue;

      const [horas, minutos] = entity.franja.horaFin.split(':').map(Number);
      const fechaStr = typeof entity.franja.fecha === 'string'
        ? entity.franja.fecha
        : (entity.franja.fecha as any).toISOString().substring(0, 10);
      const [year, month, day] = fechaStr.split('-').map(Number);
      const fechaTurno = new Date(year, month - 1, day, horas, minutos);

      if (fechaTurno < ahora) {
        const turnoDominio = this.mapearAClaseDominio(entity);
        
        try {
          turnoDominio.completar();
          const nuevoEstadoId = await getEstadoTurnoId(turnoDominio.obtenerNombreEstado());
          entity.estadoTurno = { id: nuevoEstadoId } as any;
          await this.turnoRepo.save(entity);
        } catch (e) {
          continue;
        }
      }
    }
  }
}