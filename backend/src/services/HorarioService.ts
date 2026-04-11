import { AppDataSource } from '../config/database';
import { Horario } from '../entities/Horario';
import { Between } from 'typeorm';

export class HorarioService {
  private horarioRepo = AppDataSource.getRepository(Horario);

  async crear(fecha: Date, horaInicio: string, horaFin: string): Promise<Horario> {
    const horario = this.horarioRepo.create({ fecha, horaInicio, horaFin, disponible: true });
    return this.horarioRepo.save(horario);
  }

  async getDisponibles(): Promise<Horario[]> {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(hoy.getDate() + 30);
    return this.horarioRepo.find({
      where: { disponible: true, fecha: Between(hoy, en30Dias) },
      order: { fecha: 'ASC', horaInicio: 'ASC' },
    });
  }

  async toggleDisponibilidad(id: string): Promise<Horario> {
    const horario = await this.horarioRepo.findOneBy({ id });
    if (!horario) throw new Error('Horario no encontrado');
    horario.disponible = !horario.disponible;
    return this.horarioRepo.save(horario);
  }
}
