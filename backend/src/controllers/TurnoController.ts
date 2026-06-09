// src/controllers/TurnoController.ts
import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/AuthMiddleware';
import { TurnoService } from '../services/TurnoService';
import { ReservaFacade } from '../facades/ReservaFacade';

// Instanciación de Clases de Dominio
import { Usuario as UsuarioDominio } from '../clases/Usuario';
import { FranjaHoraria as FranjaDominio } from '../clases/FranjaHoraria';
import { Turno as TurnoDominio } from '../clases/Turno';
import { Rol as RolDominio } from '../clases/Rol';

// Infraestructura de base de datos
import { AppDataSource } from '../config/database';
import { Usuario as UsuarioEntity } from '../entities/Usuario';

export class TurnoController {
  private turnoService = new TurnoService();

  /**
   * POST /
   * Reserva un turno utilizando la Fachada garantizando el formato correcto de las notas.
   */
  reservar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { franjaId, notas } = req.body;
      
      // Aseguramos que 'notas' sea al menos un string vacío para blindar TypeORM
      const notasSeguras = notas || ''; 

      const facade = new ReservaFacade();

      // Buscamos el usuario real en la base de datos
      const usuarioRepo = AppDataSource.getRepository(UsuarioEntity);
      const usuario = await usuarioRepo.findOne({
        where: { id: req.user!.id },
        relations: ['rol'],
      });

      if (!usuario) {
        res.status(404).json({ message: 'Usuario no encontrado.' });
        return;
      }

      const rolDominio = new RolDominio(
        usuario.rol?.nombre || '',
        usuario.rol?.descripcion || '',
        usuario.rol?.id
      );

      const clienteDominio = new UsuarioDominio(
        usuario.nombre,
        usuario.email,
        usuario.passwordHash || '',
        rolDominio,
        usuario.id
      );

      if (!franjaId) {
        res.status(400).json({ message: 'Franja horaria no proporcionada.' });
        return;
      }

      const franjaDominio = new FranjaDominio('', '', '', '', undefined, franjaId);

      // Invocamos a la fachada pasándole las notas sanitizadas
      const resultado = await facade.determinarReserva(clienteDominio, franjaDominio, notasSeguras);

      // Enviamos el JSON con el formato exacto que tu handleReservar en Next.js necesita leer
      res.status(201).json({
        turno: resultado.turno,
        pagoId: resultado.pagoId,
        plazoExpiracion: resultado.plazoExpiracion,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * POST /cancelar-profesional/:id
   */
  cancelarProfesional = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const profesionalId = req.user!.id;
      const turno = await this.turnoService.cancelarProfesional(req.params.id, profesionalId);
      res.json(turno);
    } catch (error: any) {
      res.status(error.message.includes('permiso') ? 403 : 400).json({ message: error.message });
    }
  };

  // =========================================================================
  // MÉTODOS DE CONSULTA (Directos al servicio)
  // =========================================================================
  getMisTurnos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const turnos = await this.turnoService.getMisTurnos(req.user!.id);
      res.json(turnos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  cancelarMio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const turno = await this.turnoService.cancelar(req.params.id, req.user!.id);
      res.json(turno);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getTodos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const turnos = await this.turnoService.getTodos();
      res.json(turnos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  cancelarAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const turno = await this.turnoService.cancelar(req.params.id);
      res.json(turno);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getTurnosProfesional = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const turnos = await this.turnoService.getTurnosByProfesional(req.user!.id);
      res.json(turnos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}