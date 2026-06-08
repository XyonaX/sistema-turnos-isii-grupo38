import { AppDataSource } from '../config/database';
import { Horario as HorarioEntity } from '../entities/Horario';
import { FranjaHoraria as FranjaEntity } from '../entities/FranjaHoraria';
import { Servicio as ServicioEntity } from '../entities/Servicio';
import { ESTADO_FRANJA } from '../constants/catalog';
import { getEstadoFranjaId } from '../repositories/catalogRepository';

// IMPORTAMOS LAS CLASES PURAS DE NEGOCIO
import { FranjaHoraria } from '../clases/FranjaHoraria'; 
import { Horario } from '../clases/Horario';

export class HorarioService {
  private horarioRepo = AppDataSource.getRepository(HorarioEntity);
  private franjaRepo = AppDataSource.getRepository(FranjaEntity);
  private servicioRepo = AppDataSource.getRepository(ServicioEntity);

  async crear(
    servicioId: string,
    fechaInicio: string,
    fechaFin: string,
    horaApertura: string,
    horaCierre: string
  ): Promise<FranjaEntity[]> {
    if (!servicioId || !fechaInicio || !fechaFin || !horaApertura || !horaCierre) {
      throw new Error('Todos los campos son requeridos');
    }

    const servicio = await this.servicioRepo.findOne({
      where: { id: servicioId },
    });

    if (!servicio) throw new Error('Servicio no encontrado');

    // 1. INSTANCIAMOS LA CLASE PURA (Aquí saltan los errores si las fechas están al revés o en el pasado)
    const horarioDominio = new Horario(fechaInicio, fechaFin, horaApertura, horaCierre);

    // 2. LA CLASE RESUELVE LA MATEMÁTICA INTERNA (Retorna el array con las horas calculadas)
    const franjasCalculadas = horarioDominio.calcularFranjasHorarias(servicio.duracionMinutos);

    const estadoLibreId = await getEstadoFranjaId(ESTADO_FRANJA.LIBRE);

    // 3. PERSISTENCIA EN LA BASE DE DATOS MEDIANTE TRANSACCIÓN
    return AppDataSource.transaction(async (manager) => {
      const horarioEntity = manager.create(HorarioEntity, {
        fechaInicio,
        fechaFin,
        horaApertura,
        horaCierre,
        servicio: { id: servicioId },
      });
      const savedHorario = await manager.save(horarioEntity);

      const franjasEntities = franjasCalculadas.map((f) =>
        manager.create(FranjaEntity, {
          fecha: f.fecha,
          horaInicio: f.horaInicio,
          horaFin: f.horaFin,
          horario: savedHorario,
          estadoFranja: { id: estadoLibreId },
        })
      );

      return manager.save(franjasEntities);
    });
  }

  async getDisponibles(): Promise<FranjaEntity[]> {
    const hoyStr = new Date().toISOString().split('T')[0];

    return this.franjaRepo
      .createQueryBuilder('franja')
      .leftJoinAndSelect('franja.estadoFranja', 'estadoFranja')
      .leftJoinAndSelect('franja.horario', 'horario')
      .leftJoinAndSelect('horario.servicio', 'servicio')
      .leftJoinAndSelect('servicio.profesional', 'profesional')
      .where('estadoFranja.nombre = :nombre', { nombre: ESTADO_FRANJA.LIBRE })
      .andWhere('franja.fecha >= :hoy', { hoy: hoyStr })
      .orderBy('franja.fecha', 'ASC')
      .addOrderBy('franja.horaInicio', 'ASC')
      .getMany();
  }

  async toggleDisponibilidad(id: string): Promise<FranjaEntity> {
    // 1. Buscamos la entidad en la base de datos con su relación de estado
    const franjaEntity = await this.franjaRepo.findOne({
      where: { id },
      relations: { estadoFranja: true },
    });
    if (!franjaEntity) throw new Error('Franja horaria no encontrada');

    // 2. MAPEÓ AL DOMINIO: Instanciamos tu clase pura con los datos de la persistencia
    const franjaDominio = new FranjaHoraria(
      franjaEntity.fecha,
      franjaEntity.horaInicio,
      franjaEntity.horaFin,
      franjaEntity.estadoFranja.nombre,
      franjaEntity.motivoBloqueo,
      franjaEntity.id
    );

    // 3. LÓGICA DE NEGOCIO: La clase evalúa sus reglas y muta su estado interno en memoria
    franjaDominio.alternarDisponibilidad();

    // 4. SINCRONIZACIÓN: Traducimos el resultado del dominio de vuelta a estructuras de la BD
    const nuevoEstadoId = await getEstadoFranjaId(franjaDominio.obtenerEstado());
    
    franjaEntity.estadoFranja = { id: nuevoEstadoId } as any;
    franjaEntity.motivoBloqueo = franjaDominio.obtenerMotivoBloqueo();

    // 5. PERSISTENCIA: Guardamos la entidad actualizada
    return this.franjaRepo.save(franjaEntity);
  }

  async getAll(): Promise<FranjaEntity[]> {
    return this.franjaRepo.find({
      relations: { estadoFranja: true, horario: { servicio: true } },
      order: { fecha: 'ASC', horaInicio: 'ASC' },
    });
  }

  async getFranjasByProfesional(profesionalId: string): Promise<FranjaEntity[]> {
    return this.franjaRepo
      .createQueryBuilder('franja')
      .leftJoinAndSelect('franja.estadoFranja', 'estadoFranja')
      .leftJoinAndSelect('franja.horario', 'horario')
      .leftJoinAndSelect('horario.servicio', 'servicio')
      .leftJoinAndSelect('servicio.profesional', 'profesional')
      .leftJoinAndSelect('franja.turno', 'turno')
      .leftJoinAndSelect('turno.cliente', 'cliente')
      .where('profesional.id = :profesionalId', { profesionalId })
      .orderBy('franja.fecha', 'ASC')
      .addOrderBy('franja.horaInicio', 'ASC')
      .getMany();
  }

  async cancelar(id: string): Promise<void> {
    const franja = await this.franjaRepo.findOneBy({ id });
    if (!franja) throw new Error('Franja horaria no encontrada');
    await this.franjaRepo.remove(franja);
  }
}