import { AppDataSource } from '../config/database';
import { Servicio } from '../entities/Servicio';
import { Usuario } from '../entities/Usuario';

export class ServicioService {
  private servicioRepo = AppDataSource.getRepository(Servicio);
  private usuarioRepo = AppDataSource.getRepository(Usuario);

  async crear(
    profesionalId: string,
    nombre: string,
    descripcion?: string,
    duracionMinutos: number = 60,
    precio: number = 0
  ): Promise<Servicio> {
    if (!profesionalId || !nombre) {
      throw new Error('Profesional ID y nombre son requeridos');
    }

    const profesional = await this.usuarioRepo.findOne({
      where: { id: profesionalId },
      relations: { rol: true },
    });

    if (!profesional) {
      throw new Error('Profesional no encontrado');
    }

    if (profesional.rol?.nombre !== 'profesional') {
      throw new Error('Solo los profesionales pueden crear servicios');
    }

    const servicio = this.servicioRepo.create({
      nombre,
      descripcion: descripcion || '',
      duracionMinutos,
      precio,
      profesional,
    });

    return this.servicioRepo.save(servicio);
  }

  async listarTodos(): Promise<Servicio[]> {
    return this.servicioRepo.find({
      relations: { profesional: true },
      order: { nombre: 'ASC' },
    });
  }

  async listar(profesionalId: string): Promise<Servicio[]> {
    if (!profesionalId) {
      throw new Error('Profesional ID es requerido');
    }

    return this.servicioRepo.find({
      where: { profesional: { id: profesionalId } },
      relations: { profesional: true },
    });
  }

  async obtener(servicioId: string): Promise<Servicio> {
    if (!servicioId) {
      throw new Error('Servicio ID es requerido');
    }

    const servicio = await this.servicioRepo.findOne({
      where: { id: servicioId },
      relations: { profesional: true },
    });

    if (!servicio) {
      throw new Error('Servicio no encontrado');
    }

    return servicio;
  }

  async actualizar(
    servicioId: string,
    profesionalId: string,
    datos: Partial<Servicio>
  ): Promise<Servicio> {
    if (!servicioId) {
      throw new Error('Servicio ID es requerido');
    }

    const servicio = await this.servicioRepo.findOne({
      where: { id: servicioId },
      relations: { profesional: true },
    });

    if (!servicio) {
      throw new Error('Servicio no encontrado');
    }

    if (servicio.profesional.id !== profesionalId) {
      throw new Error('No tienes permiso para actualizar este servicio');
    }

    if (datos.nombre) servicio.nombre = datos.nombre;
    if (datos.descripcion !== undefined) servicio.descripcion = datos.descripcion;
    if (datos.duracionMinutos !== undefined) servicio.duracionMinutos = datos.duracionMinutos;
    if (datos.precio !== undefined) servicio.precio = datos.precio;

    return this.servicioRepo.save(servicio);
  }

  async eliminar(servicioId: string, profesionalId: string): Promise<void> {
    if (!servicioId) {
      throw new Error('Servicio ID es requerido');
    }

    const servicio = await this.servicioRepo.findOne({
      where: { id: servicioId },
      relations: { profesional: true },
    });

    if (!servicio) {
      throw new Error('Servicio no encontrado');
    }

    if (servicio.profesional.id !== profesionalId) {
      throw new Error('No tienes permiso para eliminar este servicio');
    }

    await this.servicioRepo.remove(servicio);
  }
}
