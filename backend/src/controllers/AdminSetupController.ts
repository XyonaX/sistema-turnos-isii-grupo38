import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Usuario, RolUsuario } from '../entities/Usuario';
import { AuthService } from '../services/AuthService';
import bcrypt from 'bcryptjs';

export class AdminSetupController {
  private usuarioRepo = AppDataSource.getRepository(Usuario);
  private authService = new AuthService();

  crearAdminInicial = async (req: Request, res: Response): Promise<void> => {
    try {
      // Verificar si ya existe un admin
      const adminExistente = await this.usuarioRepo.findOne({
        where: { rol: RolUsuario.ADMIN },
      });

      if (adminExistente) {
        res.status(400).json({
          message: 'Ya existe un administrador en el sistema',
        });
        return;
      }

      const { nombre, email, password } = req.body;

      // Validaciones
      if (!nombre || !email || !password) {
        res.status(400).json({
          message: 'Nombre, email y contraseña son requeridos',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          message: 'La contraseña debe tener al menos 6 caracteres',
        });
        return;
      }

      // Verificar si el email ya existe
      const existente = await this.usuarioRepo.findOneBy({ email });
      if (existente) {
        res.status(400).json({
          message: 'El email ya está registrado',
        });
        return;
      }

      // Crear el admin
      const passwordHash = await bcrypt.hash(password, 10);
      const admin = this.usuarioRepo.create({
        nombre,
        email,
        passwordHash,
        rol: RolUsuario.ADMIN,
      });

      await this.usuarioRepo.save(admin);

      res.status(201).json({
        message: '✓ Administrador creado correctamente',
        email: admin.email,
      });
    } catch (error: any) {
      console.error('Error creando admin inicial:', error);
      res.status(500).json({
        message: error.message || 'Error al crear el administrador',
      });
    }
  };
}
