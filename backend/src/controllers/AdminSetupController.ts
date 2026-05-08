import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Usuario } from '../entities/Usuario';
import { Rol } from '../entities/Rol';
import { AuthService } from '../services/AuthService';
import bcrypt from 'bcryptjs';

export class AdminSetupController {
  private usuarioRepo = AppDataSource.getRepository(Usuario);
  private rolRepo = AppDataSource.getRepository(Rol);
  private authService = new AuthService();

  // Crear roles iniciales
  crearRolesIniciales = async (req: Request, res: Response): Promise<void> => {
    try {
      const rolesACrear = [
        { nombre: 'cliente', descripcion: 'Usuario cliente que reserva turnos' },
        { nombre: 'profesional', descripcion: 'Profesional que ofrece servicios' },
        { nombre: 'admin', descripcion: 'Administrador del sistema' },
      ];

      const rolesCreados = [];

      for (const rolData of rolesACrear) {
        const rolExistente = await this.rolRepo.findOneBy({ nombre: rolData.nombre });
        if (!rolExistente) {
          const nuevoRol = this.rolRepo.create(rolData);
          await this.rolRepo.save(nuevoRol);
          rolesCreados.push(rolData.nombre);
        }
      }

      res.json({
        message: '✓ Roles configurados correctamente',
        rolesCreados: rolesCreados.length > 0 ? rolesCreados : 'Todos ya existían',
      });
    } catch (error: any) {
      console.error('Error creando roles:', error);
      res.status(500).json({
        message: error.message || 'Error al crear los roles',
      });
    }
  };

  crearAdminInicial = async (req: Request, res: Response): Promise<void> => {
    try {
      // Verificar si ya existe un admin
      const adminRol = await this.rolRepo.findOneBy({ nombre: 'admin' });
      const adminExistente = adminRol
        ? await this.usuarioRepo.findOne({
            where: { rol: adminRol },
            relations: { rol: true },
          })
        : null;

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

      // Obtener el rol admin (crear si no existe)
      let rolAdmin = await this.rolRepo.findOneBy({ nombre: 'admin' });
      if (!rolAdmin) {
        rolAdmin = this.rolRepo.create({
          nombre: 'admin',
          descripcion: 'Administrador del sistema',
        });
        await this.rolRepo.save(rolAdmin);
      }

      // Crear el admin
      const passwordHash = await bcrypt.hash(password, 10);
      const admin = this.usuarioRepo.create({
        nombre,
        email,
        passwordHash,
        rol: rolAdmin,
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
