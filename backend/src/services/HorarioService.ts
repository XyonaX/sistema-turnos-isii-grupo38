import { AppDataSource } from '../config/database';
import { FranjaHoraria } from '../entities/FranjaHoraria';
import { Horario } from '../entities/Horario';
import { Servicio } from '../entities/Servicio';

export class HorarioService {
  private horarioRepo = AppDataSource.getRepository(Horario);
  private franjaRepo = AppDataSource.getRepository(FranjaHoraria);
  private servicioRepo = AppDataSource.getRepository(Servicio);

  private horaAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  private sumarMinutos(hora: string, minutos: number): string {
    let totalMinutos = this.horaAMinutos(hora) + minutos;
    if (totalMinutos >= 1440) totalMinutos = 0;
    const h = Math.floor(totalMinutos / 60)
      .toString()
      .padStart(2, '0');
    const m = (totalMinutos % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  async crear(
    profesionalId: string,
    servicioId: string,
    fechaInicio: Date,
    fechaFin: Date,
    horaInicio: string,
    horaFin: string,
    lapsoMinutos: number = 60
  ): Promise<FranjaHoraria[]> {
    // Validaciones básicas
    if (!profesionalId || !servicioId || !fechaInicio || !fechaFin || !horaInicio || !horaFin) {
      throw new Error('Todos los campos son requeridos');
    }

    // Validar que lapsoMinutos es positivo
    if (lapsoMinutos <= 0) {
      throw new Error('El lapso en minutos debe ser positivo');
    }

    // Validar que el servicio existe y que el profesional es propietario
    const servicio = await this.servicioRepo.findOne({
      where: { id: servicioId },
      relations: { profesional: true },
    });

    if (!servicio) {
      throw new Error('Servicio no encontrado');
    }

    if (servicio.profesional.id !== profesionalId) {
      throw new Error('El profesional no es propietario de este servicio');
    }

    // Validar fechas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaInicioVal = new Date(fechaInicio);
    fechaInicioVal.setHours(0, 0, 0, 0);
    const fechaFinVal = new Date(fechaFin);
    fechaFinVal.setHours(0, 0, 0, 0);

    if (fechaInicioVal < hoy) {
      throw new Error('No se pueden crear horarios en fechas pasadas');
    }

    if (fechaFinVal < fechaInicioVal) {
      throw new Error('La fecha de fin debe ser mayor o igual a la fecha de inicio');
    }

    // Validar formato de horas
    const formatoHora = /^\d{2}:\d{2}$/;
    if (!formatoHora.test(horaInicio) || !formatoHora.test(horaFin)) {
      throw new Error('El formato de hora debe ser HH:MM');
    }

    if (horaInicio >= horaFin) {
      throw new Error('La hora de fin debe ser mayor a la hora de inicio');
    }

    // Generar franjas para cada fecha en el rango
    const franjas: FranjaHoraria[] = [];
    const fechaActual = new Date(fechaInicioVal);

    while (fechaActual <= fechaFinVal) {
      const fechaStr = fechaActual.toISOString().split('T')[0];

      // Buscar o crear el Horario para esa fecha
      let horario = await this.horarioRepo.findOne({
        where: { fecha: fechaStr, servicio: { id: servicioId } },
      });

      if (!horario) {
        // Use property assignment to avoid TypeORM create() overload ambiguity
        const nuevoHorario = this.horarioRepo.create();
        nuevoHorario.fecha = fechaStr;
        nuevoHorario.lapsoMinutos = lapsoMinutos;
        nuevoHorario.servicio = servicio;
        horario = await this.horarioRepo.save(nuevoHorario);
      }

      // Generar FranjaHoraria con lapsoMinutos
      let horaActual = horaInicio;

      while (horaActual < horaFin) {
        const horaSiguiente = this.sumarMinutos(horaActual, lapsoMinutos);

        // Prevenir franja parcial al final - si horaSiguiente > horaFin, no crear
        if (horaSiguiente > horaFin) {
          break;
        }

        const existente = await this.franjaRepo.findOne({
          where: {
            horario: { id: horario?.id },
            horaInicio: horaActual,
            horaFin: horaSiguiente,
          },
        });

        if (!existente) {
          const franja = this.franjaRepo.create();
          franja.horaInicio = horaActual;
          franja.horaFin = horaSiguiente;
          franja.disponible = true;
          franja.horario = horario!;
          franjas.push(await this.franjaRepo.save(franja));
        }

        horaActual = horaSiguiente;
      }

      // Siguiente día
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return franjas;
  }

  async getDisponibles(): Promise<FranjaHoraria[]> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en30Dias = new Date(hoy);
    en30Dias.setDate(hoy.getDate() + 30);

    const hoyStr = hoy.toISOString().split('T')[0];
    const en30DiasStr = en30Dias.toISOString().split('T')[0];

    return this.franjaRepo
      .createQueryBuilder('franja')
      .leftJoinAndSelect('franja.horario', 'horario')
      .leftJoinAndSelect('horario.servicio', 'servicio')
      .leftJoinAndSelect('servicio.profesional', 'profesional')
      .where('franja.disponible = true')
      .andWhere('horario.fecha BETWEEN :hoy AND :fin', { hoy: hoyStr, fin: en30DiasStr })
      .orderBy('horario.fecha', 'ASC')
      .addOrderBy('franja.horaInicio', 'ASC')
      .getMany();
  }

  async toggleDisponibilidad(id: string): Promise<FranjaHoraria> {
    const franja = await this.franjaRepo.findOneBy({ id });
    if (!franja) throw new Error('Franja horaria no encontrada');
    franja.disponible = !franja.disponible;
    return this.franjaRepo.save(franja);
  }

  async getAll(): Promise<FranjaHoraria[]> {
    return this.franjaRepo.find({
      relations: { horario: true },
      order: { horario: { fecha: 'ASC' }, horaInicio: 'ASC' },
    });
  }

  async getFranjasByProfesional(profesionalId: string): Promise<FranjaHoraria[]> {
    return this.franjaRepo
      .createQueryBuilder('franja')
      .leftJoinAndSelect('franja.horario', 'horario')
      .leftJoinAndSelect('horario.servicio', 'servicio')
      .leftJoinAndSelect('servicio.profesional', 'profesional')
      .leftJoinAndSelect('franja.turno', 'turno')
      .leftJoinAndSelect('turno.cliente', 'cliente')
      .where('profesional.id = :profesionalId', { profesionalId })
      .orderBy('horario.fecha', 'ASC')
      .addOrderBy('franja.horaInicio', 'ASC')
      .getMany();
  }

  async cancelar(id: string): Promise<void> {
    const franja = await this.franjaRepo.findOneBy({ id });
    if (!franja) throw new Error('Franja horaria no encontrada');
    await this.franjaRepo.remove(franja);
  }
}
