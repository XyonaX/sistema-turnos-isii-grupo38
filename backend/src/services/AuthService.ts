import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AppDataSource } from '../config/database';
import { Rol } from '../entities/Rol';
import { Usuario } from '../entities/Usuario';
import { Usuario as UsuarioDominio } from '../clases/Usuario';
import { Rol as RolDominio } from '../clases/Rol';

export class AuthService {
  private usuarioRepo = AppDataSource.getRepository(Usuario);
  private rolRepo = AppDataSource.getRepository(Rol);

  async register(
    nombre: string,
    email: string,
    password: string,
    rolNombre: string
  ): Promise<{ token: string; user: { id: string; nombre: string; email: string; rol?: string } }> {
    const existing = await this.usuarioRepo.findOneBy({ email });
    if (existing) throw new Error('El correo ya está registrado');

    const rol = await this.rolRepo.findOneBy({ nombre: rolNombre });
    if (!rol) throw new Error(`Rol "${rolNombre}" no encontrado`);

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = this.usuarioRepo.create({ nombre, email, passwordHash, rol });
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
    //Validar que el usuario existe y comparar contraseña
    const usuario = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .addSelect('usuario.passwordHash')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.email = :email', { email })
      .getOne();

    if (!usuario) throw new Error('Credenciales inválidas');
    const rolDominio = new RolDominio(
      usuario.rol?.nombre || '',
      usuario.rol?.descripcion || '',
      usuario.rol?.id
    );
    const usuarioDominio = new UsuarioDominio(
      usuario.nombre,
      usuario.email,
      usuario.passwordHash,
      rolDominio,
      usuario.id
    );
    const valid = await usuarioDominio.verificarContrasenia(password);
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
}
