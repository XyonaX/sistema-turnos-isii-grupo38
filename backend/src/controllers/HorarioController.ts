import { Request, Response } from 'express';
import { HorarioService } from '../services/HorarioService';

export class HorarioController {
  private horarioService = new HorarioService();

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fecha, horaInicio, horaFin } = req.body;
      const horario = await this.horarioService.crear(new Date(fecha), horaInicio, horaFin);
      res.status(201).json(horario);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getDisponibles = async (_req: Request, res: Response): Promise<void> => {
    try {
      const horarios = await this.horarioService.getDisponibles();
      res.json(horarios);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  toggleDisponibilidad = async (req: Request, res: Response): Promise<void> => {
    try {
      const horario = await this.horarioService.toggleDisponibilidad(req.params.id);
      res.json(horario);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
