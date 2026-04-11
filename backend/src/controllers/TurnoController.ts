import { Response } from 'express';
import { TurnoService } from '../services/TurnoService';
import { AuthRequest } from '../middlewares/AuthMiddleware';

export class TurnoController {
  private turnoService = new TurnoService();

  reservar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { horarioId, notas } = req.body;
      const turno = await this.turnoService.reservar(req.user!.id, horarioId, notas);
      res.status(201).json(turno);
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
}
