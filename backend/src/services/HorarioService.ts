import { AppDataSource } from '../config/database';
import { Horario } from '../entities/Horario';
import { Between } from 'typeorm';

export class HorarioService {
  private horarioRepo = AppDataSource.getRepository(Horario);

  /**
   * Convierte una hora en string (HH:MM) a minutos desde medianoche
   */
  private horaAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  /**
   * Suma minutos a una hora y retorna en formato HH:MM
   */
  private sumarMinutos(hora: string, minutos: number): string {
    let totalMinutos = this.horaAMinutos(hora) + minutos;
    if (totalMinutos >= 1440) totalMinutos = 0; // Evitar desbordamiento
    const h = Math.floor(totalMinutos / 60).toString().padStart(2, '0');
    const m = (totalMinutos % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  async crear(fecha: Date, horaInicio: string, horaFin: string): Promise<Horario[]> {
    // Validaciones
    if (!fecha || !horaInicio || !horaFin) {
      throw new Error('Todos los campos son requeridos');
    }

    // Validar que la fecha no sea en el pasado
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaValidar = new Date(fecha);
    fechaValidar.setHours(0, 0, 0, 0);

    if (fechaValidar < hoy) {
      throw new Error('No se pueden crear horarios en fechas pasadas');
    }

    // Validar formato de horas (HH:MM)
    const formatoHora = /^\d{2}:\d{2}$/;
    if (!formatoHora.test(horaInicio) || !formatoHora.test(horaFin)) {
      throw new Error('El formato de hora debe ser HH:MM');
    }

    // Validar que horaFin > horaInicio
    if (horaInicio >= horaFin) {
      throw new Error('La hora de fin debe ser mayor a la hora de inicio');
    }

    // Generar slots de 1 hora
    const horarios: Horario[] = [];
    let horaActual = horaInicio;

    while (horaActual < horaFin) {
      const horaSiguiente = this.sumarMinutos(horaActual, 60);

      // Verificar si ya existe
      const existente = await this.horarioRepo.findOne({
        where: {
          fecha: new Date(fecha),
          horaInicio: horaActual,
          horaFin: horaSiguiente,
        },
      });

      if (!existente) {
        const horario = this.horarioRepo.create({ 
          fecha: new Date(fecha), 
          horaInicio: horaActual, 
          horaFin: horaSiguiente, 
          disponible: true 
        });
        horarios.push(await this.horarioRepo.save(horario));
      }

      horaActual = horaSiguiente;
    }

    return horarios;
  }

  async getDisponibles(): Promise<Horario[]> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const en30Dias = new Date(hoy);
    en30Dias.setDate(hoy.getDate() + 30);

    return this.horarioRepo.find({
      where: { 
        disponible: true, 
        fecha: Between(hoy, en30Dias) 
      },
      order: { fecha: 'ASC', horaInicio: 'ASC' },
    });
  }

  async toggleDisponibilidad(id: string): Promise<Horario> {
    const horario = await this.horarioRepo.findOneBy({ id });
    if (!horario) throw new Error('Horario no encontrado');
    horario.disponible = !horario.disponible;
    return this.horarioRepo.save(horario);
  }

  async getAll(): Promise<Horario[]> {
    return this.horarioRepo.find({
      order: { fecha: 'ASC', horaInicio: 'ASC' },
    });
  }

  async cancelar(id: string): Promise<void> {
    const horario = await this.horarioRepo.findOneBy({ id });
    if (!horario) throw new Error('Horario no encontrado');
    
    // Verificar si hay turnos reservados en este horario
    // Por ahora solo eliminamos el horario
    await this.horarioRepo.remove(horario);
  }
}
