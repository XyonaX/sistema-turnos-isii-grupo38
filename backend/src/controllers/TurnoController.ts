import type { Response } from 'express';

import type { AuthRequest } from '../middlewares/AuthMiddleware';
import { TurnoService } from '../services/TurnoService';

export class TurnoController {
  private turnoService = new TurnoService();

  // Devuelve también pagoId y plazoExpiracion para que el front inicie el flujo de pago
  reservar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { franjaId, notas } = req.body;
      const { turno, pagoId, plazoExpiracion } = await this.turnoService.reservar(
        req.user!.id,
        franjaId,
        notas
      );
      res.status(201).json({ turno, pagoId, plazoExpiracion });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

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

  cancelarProfesional = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const turno = await this.turnoService.cancelarProfesional(req.params.id, req.user!.id);
      res.json(turno);
    } catch (error: any) {
      res.status(error.message.includes('permiso') ? 403 : 400).json({ message: error.message });
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
