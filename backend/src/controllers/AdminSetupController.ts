import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';

import { AppDataSource } from '../config/database';
import { Rol } from '../entities/Rol';
import { Usuario } from '../entities/Usuario';

export class AdminSetupController {
  private usuarioRepo = AppDataSource.getRepository(Usuario);
  private rolRepo = AppDataSource.getRepository(Rol);

  crearAdminInicial = async (req: Request, res: Response): Promise<void> => {
    try {
      // Verificar si ya existe un profesional
      const profesionalExistente = await this.usuarioRepo.findOne({
        where: { rol: { nombre: 'profesional' } },
        relations: { rol: true },
      });

      if (profesionalExistente) {
        res.status(400).json({
          message: 'Ya existe un profesional en el sistema',
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

      // Buscar o crear el rol profesional
      let rolProfesional = await this.rolRepo.findOneBy({ nombre: 'profesional' });
      if (!rolProfesional) {
        rolProfesional = await this.rolRepo.save(
          this.rolRepo.create({ nombre: 'profesional', descripcion: 'Profesional del sistema' })
        );
      }

      // Crear el profesional
      const passwordHash = await bcrypt.hash(password, 10);
      const profesional = this.usuarioRepo.create({
        nombre,
        email,
        passwordHash,
        rol: rolProfesional,
      });

      await this.usuarioRepo.save(profesional);

      res.status(201).json({
        message: '✓ Profesional creado correctamente',
        email: profesional.email,
      });
    } catch (error: unknown) {
      console.error('Error creando profesional inicial:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Error al crear el profesional',
      });
    }
  };
}
