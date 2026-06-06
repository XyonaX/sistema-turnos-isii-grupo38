import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AppDataSource } from '../config/database';
import { Rol } from '../entities/Rol';
import { Usuario } from '../entities/Usuario';

export class AuthService {
  private usuarioRepo = AppDataSource.getRepository(Usuario);
  private rolRepo = AppDataSource.getRepository(Rol);

  private async obtenerOCrearRoles() {
    let clienteRol = await this.rolRepo.findOneBy({ nombre: 'Cliente' });
    if (!clienteRol) {
      clienteRol = this.rolRepo.create({
        nombre: 'Cliente',
        descripcion: 'Usuario cliente que reserva turnos',
      });
      await this.rolRepo.save(clienteRol);
    }

    let profesionalRol = await this.rolRepo.findOneBy({ nombre: 'Profesional' });
    if (!profesionalRol) {
      profesionalRol = this.rolRepo.create({
        nombre: 'Profesional',
        descripcion: 'Profesional que ofrece servicios',
      });
      await this.rolRepo.save(profesionalRol);
    }

    let adminRol = await this.rolRepo.findOneBy({ nombre: 'Admin' });
    if (!adminRol) {
      adminRol = this.rolRepo.create({
        nombre: 'Admin',
        descripcion: 'Administrador del sistema',
      });
      await this.rolRepo.save(adminRol);
    }

    return { clienteRol, profesionalRol, adminRol };
  }

  async register(
    nombre: string,
    email: string,
    password: string
  ): Promise<{ token: string; user: { id: string; nombre: string; email: string; rol?: string } }> {
    const existing = await this.usuarioRepo.findOneBy({ email });
    if (existing) throw new Error('El correo ya está registrado');

    const { clienteRol } = await this.obtenerOCrearRoles();

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = this.usuarioRepo.create({
      nombre,
      email,
      passwordHash,
      rol: clienteRol,
    });
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
    const usuario = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .addSelect('usuario.passwordHash')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.email = :email', { email })
      .getOne();

    if (!usuario) throw new Error('Credenciales inválidas');
    const valid = await bcrypt.compare(password, usuario.passwordHash);
    if (!valid) throw new Error('Credenciales inválidas');

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

  async cambiarRol(usuarioId: string, rolNombre: string): Promise<string> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuarioId },
      relations: { rol: true },
    });
    if (!usuario) throw new Error('Usuario no encontrado');

    const rol = await this.rolRepo.findOneBy({ nombre: rolNombre });
    if (!rol) throw new Error(`Rol "${rolNombre}" no encontrado`);

    usuario.rol = rol;
    await this.usuarioRepo.save(usuario);

    return rol.nombre;
  }
}