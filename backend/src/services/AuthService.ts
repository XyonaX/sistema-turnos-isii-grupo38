import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AppDataSource } from '../config/database';
import { Usuario, RolUsuario } from '../entities/Usuario';

export class AuthService {
  private usuarioRepo = AppDataSource.getRepository(Usuario);

  async register(nombre: string, email: string, password: string): Promise<Usuario> {
    const existing = await this.usuarioRepo.findOneBy({ email });
    if (existing) throw new Error('El correo ya está registrado');
    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = this.usuarioRepo.create({ nombre, email, passwordHash });
    return this.usuarioRepo.save(usuario);
  }

  async login(email: string, password: string): Promise<string> {
    const usuario = await this.usuarioRepo.findOneBy({ email });
    if (!usuario) throw new Error('Credenciales inválidas');
    const valid = await bcrypt.compare(password, usuario.passwordHash);
    if (!valid) throw new Error('Credenciales inválidas');
    return jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as jwt.SignOptions['expiresIn'] }
    );
  }
}
