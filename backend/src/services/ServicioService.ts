// src/services/ServicioService.ts
import { AppDataSource } from '../config/database';
import { Servicio as ServicioEntity } from '../entities/Servicio';
import { Usuario as UsuarioEntity } from '../entities/Usuario';

// IMPORTAMOS TUS CLASES PURAS DE DOMINIO
import { Servicio } from '../clases/Servicio';
import { Usuario } from '../clases/Usuario';
import { Rol } from '../clases/Rol';

export class ServicioService {
  private servicioRepo = AppDataSource.getRepository(ServicioEntity);
  private usuarioRepo = AppDataSource.getRepository(UsuarioEntity);

  // =========================================================================
  // HELPER: Convierte una Entity de BD en tu Objeto de Dominio Puro
  // =========================================================================
  private mapearAClaseDominio(entity: ServicioEntity): Servicio {
    const rolDominio = new Rol(
      entity.profesional?.rol?.nombre || '',
      entity.profesional?.rol?.descripcion || '',
      entity.profesional?.rol?.id
    );

    const usuarioDominio = new Usuario(
      entity.profesional?.nombre || '',
      entity.profesional?.email || '',
      '', // No se requiere passwordHash para esta gestión
      rolDominio,
      entity.profesional?.id
    );

    return new Servicio(
      entity.nombre,
      usuarioDominio,
      entity.duracionMinutos,
      Number(entity.precio),
      entity.descripcion || undefined,
      entity.id
    );
  }

  // =========================================================================
  // MÉTODOS DEL SERVICIO
  // =========================================================================

  async crear(
    profesionalId: string,
    nombre: string,
    descripcion?: string,
    duracionMinutos: number = 60,
    precio: number = 0
  ): Promise<ServicioEntity> {
    if (!profesionalId || !nombre) {
      throw new Error('Profesional ID y nombre son requeridos');
    }

    // Buscamos al usuario con su rol para validar en el dominio
    const profesionalEntity = await this.usuarioRepo.findOne({
      where: { id: profesionalId },
      relations: { rol: true },
    });

    if (!profesionalEntity) throw new Error('Profesional no encontrado');

    // 1. Armamos el árbol de objetos puros para la validación
    const rolDominio = new Rol(profesionalEntity.rol?.nombre || '', '');
    const profesionalDominio = new Usuario(profesionalEntity.nombre, profesionalEntity.email, '', rolDominio, profesionalEntity.id);

    // 2. Instanciamos la clase pura (Aquí saltan las validaciones de rol, precio y duración)
    new Servicio(nombre, profesionalDominio, duracionMinutos, precio, descripcion);

    // 3. Si pasó el filtro del dominio, persistimos usando TypeORM
    const servicio = this.servicioRepo.create({
      nombre,
      descripcion: descripcion || '',
      duracionMinutos,
      precio,
      profesional: { id: profesionalId },
    });

    return this.servicioRepo.save(servicio);
  }

  async listarTodos(): Promise<ServicioEntity[]> {
    return this.servicioRepo.find({
      relations: { profesional: true },
      order: { nombre: 'ASC' },
    });
  }

  async listar(profesionalId: string): Promise<ServicioEntity[]> {
    if (!profesionalId) throw new Error('Profesional ID es requerido');

    return this.servicioRepo.find({
      where: { profesional: { id: profesionalId } },
      relations: { profesional: true },
    });
  }

  async obtener(servicioId: string): Promise<ServicioEntity> {
    if (!servicioId) throw new Error('Servicio ID es requerido');

    const servicio = await this.servicioRepo.findOne({
      where: { id: servicioId },
      relations: { profesional: { rol: true } },
    });

    if (!servicio) throw new Error('Servicio no encontrado');
    return servicio;
  }

  async actualizar(
    servicioId: string,
    profesionalId: string,
    datos: Partial<ServicioEntity>
  ): Promise<ServicioEntity> {
    const servicioEntity = await this.servicioRepo.findOne({
      where: { id: servicioId },
      relations: { profesional: { rol: true } },
    });

    if (!servicioEntity) throw new Error('Servicio no encontrado');

    // INTERACCIÓN CON EL DOMINIO: Convertimos a objeto puro y validamos seguridad
    const servicioDominio = this.mapearAClaseDominio(servicioEntity);
    servicioDominio.validarSeguridadPropietario(profesionalId);

    // Aplicamos los cambios solicitados a la entidad
    if (datos.nombre) servicioEntity.nombre = datos.nombre;
    if (datos.descripcion !== undefined) servicioEntity.descripcion = datos.descripcion;
    if (datos.duracionMinutos !== undefined) servicioEntity.duracionMinutos = datos.duracionMinutos;
    if (datos.precio !== undefined) servicioEntity.precio = datos.precio;

    // Volvemos a validar el objeto resultante simulando el cambio en el dominio
    const profesionalDominio = servicioDominio.obtenerProfesional();
    new Servicio(
      servicioEntity.nombre,
      profesionalDominio,
      servicioEntity.duracionMinutos,
      servicioEntity.precio,
      servicioEntity.descripcion || undefined
    );

    return this.servicioRepo.save(servicioEntity);
  }

  async eliminar(servicioId: string, profesionalId: string): Promise<void> {
    const servicioEntity = await this.servicioRepo.findOne({
      where: { id: servicioId },
      relations: { profesional: { rol: true } },
    });

    if (!servicioEntity) throw new Error('Servicio no encontrado');

    // INTERACCIÓN CON EL DOMINIO: Validamos que quien borra sea el verdadero dueño
    const servicioDominio = this.mapearAClaseDominio(servicioEntity);
    servicioDominio.validarSeguridadPropietario(profesionalId);

    await this.servicioRepo.remove(servicioEntity);
  }
}