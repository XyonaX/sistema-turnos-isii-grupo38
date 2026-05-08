import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AppDataSource } from '../config/database';
import { Rol } from '../entities/Rol';
import { Usuario } from '../entities/Usuario';
import { Rol } from '../entities/Rol';

export class AuthService {
  private usuarioRepo = AppDataSource.getRepository(Usuario);
  private rolRepo = AppDataSource.getRepository(Rol);
<<<<<<< HEAD
=======

  // Función para obtener o crear los roles por defecto
  private async obtenerOCrearRoles() {
    let clienteRol = await this.rolRepo.findOneBy({ nombre: 'cliente' });
    if (!clienteRol) {
      clienteRol = this.rolRepo.create({
        nombre: 'cliente',
        descripcion: 'Usuario cliente que reserva turnos',
      });
      await this.rolRepo.save(clienteRol);
    }

    let profesionalRol = await this.rolRepo.findOneBy({ nombre: 'profesional' });
    if (!profesionalRol) {
      profesionalRol = this.rolRepo.create({
        nombre: 'profesional',
        descripcion: 'Profesional que ofrece servicios',
      });
      await this.rolRepo.save(profesionalRol);
    }

    let adminRol = await this.rolRepo.findOneBy({ nombre: 'admin' });
    if (!adminRol) {
      adminRol = this.rolRepo.create({
        nombre: 'admin',
        descripcion: 'Administrador del sistema',
      });
      await this.rolRepo.save(adminRol);
    }

    return { clienteRol, profesionalRol, adminRol };
  }
>>>>>>> lisandro-desarrollo

  async register(
    nombre: string,
    email: string,
    password: string,
    rolNombre: string
  ): Promise<{ token: string; user: { id: string; nombre: string; email: string; rol?: string } }> {
    const existing = await this.usuarioRepo.findOneBy({ email });
    if (existing) throw new Error('El correo ya está registrado');

<<<<<<< HEAD
    const rol = await this.rolRepo.findOneBy({ nombre: rolNombre });
    if (!rol) throw new Error(`Rol "${rolNombre}" no encontrado`);

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = this.usuarioRepo.create({ nombre, email, passwordHash, rol });
=======
    // Obtener o crear los roles por defecto
    const { clienteRol } = await this.obtenerOCrearRoles();

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = this.usuarioRepo.create({
      nombre,
      email,
      passwordHash,
      rol: clienteRol, // Asignar rol cliente por defecto
    });
>>>>>>> lisandro-desarrollo
    const savedUsuario = await this.usuarioRepo.save(usuario);

    const usuarioConRol = await this.usuarioRepo.findOne({
      where: { id: savedUsuario.id },
      relations: { rol: true },
    });
    const rolNombreFromDB = usuarioConRol?.rol?.nombre;

    const token = jwt.sign(
      {
        id: savedUsuario.id,
        email: savedUsuario.email,
        nombre: savedUsuario.nombre,
        rol: rolNombreFromDB,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as jwt.SignOptions['expiresIn'] }
    );

    return {
      token,
      user: {
        id: savedUsuario.id,
        nombre: savedUsuario.nombre,
        email: savedUsuario.email,
        rol: rolNombreFromDB,
      },
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: { id: string; nombre: string; email: string; rol?: string } }> {
    // addSelect needed because passwordHash has select: false
    const usuario = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .addSelect('usuario.passwordHash')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.email = :email', { email })
      .getOne();

    if (!usuario) throw new Error('Credenciales inválidas');
    const valid = await bcrypt.compare(password, usuario.passwordHash);
    if (!valid) throw new Error('Credenciales inválidas');

    // Si el usuario no tiene rol asignado, asignar cliente por defecto
    if (!usuario.rol) {
      const { clienteRol } = await this.obtenerOCrearRoles();
      usuario.rol = clienteRol;
      await this.usuarioRepo.save(usuario);
    }

    const rolNombre = usuario.rol?.nombre;

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: rolNombre },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as jwt.SignOptions['expiresIn'] }
    );

    return {
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: rolNombre,
      },
    };
  }

  async cambiarRol(usuarioId: string, nuevoRolNombre: string): Promise<string> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuarioId },
      relations: { rol: true },
    });

    if (!usuario) throw new Error('Usuario no encontrado');

    const nuevoRol = await this.rolRepo.findOneBy({ nombre: nuevoRolNombre });
    if (!nuevoRol) throw new Error('Rol no válido');

    usuario.rol = nuevoRol;
    await this.usuarioRepo.save(usuario);

    return nuevoRolNombre;
  }
}
