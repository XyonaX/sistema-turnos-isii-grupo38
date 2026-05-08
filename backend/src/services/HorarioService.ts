import { AppDataSource } from '../config/database';
import { FranjaHoraria } from '../entities/FranjaHoraria';
import { Horario } from '../entities/Horario';
import { Servicio } from '../entities/Servicio';
import { ESTADO_FRANJA } from '../constants/catalog';
import { getEstadoFranjaId } from '../repositories/catalogRepository';

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
    servicioId: string,
    fechaInicio: string,
    fechaFin: string,
    horaApertura: string,
    horaCierre: string
  ): Promise<FranjaHoraria[]> {
    if (!servicioId || !fechaInicio || !fechaFin || !horaApertura || !horaCierre) {
      throw new Error('Todos los campos son requeridos');
    }

    const servicio = await this.servicioRepo.findOne({
      where: { id: servicioId },
      relations: { profesional: true },
    });

    if (!servicio) {
      throw new Error('Servicio no encontrado');
    }

    const duracionMinutos = servicio.duracionMinutos;

    if (duracionMinutos <= 0) {
      throw new Error('La duración del servicio debe ser positiva');
    }

    const parseLocalDate = (str: string): Date => {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaInicioVal = parseLocalDate(fechaInicio);
    const fechaFinVal = parseLocalDate(fechaFin);

    if (fechaInicioVal < hoy) {
      throw new Error('No se pueden crear horarios en fechas pasadas');
    }

    if (fechaFinVal < fechaInicioVal) {
      throw new Error('La fecha de fin debe ser mayor o igual a la fecha de inicio');
    }

    if (horaApertura >= horaCierre) {
      throw new Error('La hora de cierre debe ser mayor a la hora de apertura');
    }

    const estadoLibreId = await getEstadoFranjaId(ESTADO_FRANJA.LIBRE);

    return AppDataSource.transaction(async (manager) => {
      const horario = manager.create(Horario, {
        fechaInicio,
        fechaFin,
        horaApertura,
        horaCierre,
        servicio: { id: servicioId },
      });
      const savedHorario = await manager.save(horario);

      const franjas: FranjaHoraria[] = [];
      const fechaActual = new Date(fechaInicioVal);

      while (fechaActual <= fechaFinVal) {
        const y = fechaActual.getFullYear();
        const m = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const d = String(fechaActual.getDate()).padStart(2, '0');
        const fechaStr = `${y}-${m}-${d}`;
        let horaActual = horaApertura;

        while (horaActual < horaCierre) {
          const horaFin = this.sumarMinutos(horaActual, duracionMinutos);
          if (horaFin > horaCierre) break;

          const franja = manager.create(FranjaHoraria, {
            fecha: fechaStr,
            horaInicio: horaActual,
            horaFin,
            horario: savedHorario,
            estadoFranja: { id: estadoLibreId },
          });
          franjas.push(franja);
          horaActual = horaFin;
        }

        fechaActual.setDate(fechaActual.getDate() + 1);
      }

      return manager.save(franjas);
    });
  }

  async getDisponibles(): Promise<FranjaHoraria[]> {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    return AppDataSource.getRepository(FranjaHoraria)
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

  async toggleDisponibilidad(id: string): Promise<FranjaHoraria> {
    const franja = await this.franjaRepo.findOne({
      where: { id },
      relations: { estadoFranja: true },
    });
    if (!franja) throw new Error('Franja horaria no encontrada');

    const esLibre = franja.estadoFranja.nombre === ESTADO_FRANJA.LIBRE;
    const nuevoEstadoId = esLibre
      ? await getEstadoFranjaId(ESTADO_FRANJA.BLOQUEADA)
      : await getEstadoFranjaId(ESTADO_FRANJA.LIBRE);

    franja.estadoFranja = { id: nuevoEstadoId } as any;
    return this.franjaRepo.save(franja);
  }

  async getAll(): Promise<FranjaHoraria[]> {
    return this.franjaRepo.find({
      relations: { estadoFranja: true, horario: { servicio: true } },
      order: { fecha: 'ASC', horaInicio: 'ASC' },
    });
  }

  async getFranjasByProfesional(profesionalId: string): Promise<FranjaHoraria[]> {
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
