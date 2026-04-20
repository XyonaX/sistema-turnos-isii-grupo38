import { Request, Response } from 'express';
import { HorarioService } from '../services/HorarioService';

export class HorarioController {
  private horarioService = new HorarioService();

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fecha, horaInicio, horaFin } = req.body;

      // Validar que los campos estén presentes
      if (!fecha || !horaInicio || !horaFin) {
        res.status(400).json({ 
          message: 'Los campos fecha, horaInicio y horaFin son requeridos' 
        });
        return;
      }

      const horario = await this.horarioService.crear(
        new Date(fecha), 
        horaInicio, 
        horaFin
      );
      
      res.status(201).json(horario);
    } catch (error: any) {
      console.error('Error creando horario:', error);
      res.status(400).json({ 
        message: error.message || 'Error al crear el horario' 
      });
    }
  };

  getDisponibles = async (_req: Request, res: Response): Promise<void> => {
    try {
      const horarios = await this.horarioService.getDisponibles();
      res.json(horarios);
    } catch (error: any) {
      console.error('Error obteniendo horarios disponibles:', error);
      res.status(500).json({ 
        message: error.message || 'Error al obtener horarios' 
      });
    }
  };

  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const horarios = await this.horarioService.getAll();
      res.json(horarios);
    } catch (error: any) {
      console.error('Error obteniendo todos los horarios:', error);
      res.status(500).json({ 
        message: error.message || 'Error al obtener horarios' 
      });
    }
  };

  toggleDisponibilidad = async (req: Request, res: Response): Promise<void> => {
    try {
      const horario = await this.horarioService.toggleDisponibilidad(req.params.id);
      res.json(horario);
    } catch (error: any) {
      console.error('Error actualizando disponibilidad:', error);
      res.status(400).json({ 
        message: error.message || 'Error al actualizar disponibilidad' 
      });
    }
  };

  cancelar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.horarioService.cancelar(id);
      res.json({ message: 'Horario cancelado correctamente' });
    } catch (error: any) {
      console.error('Error cancelando horario:', error);
      res.status(400).json({ 
        message: error.message || 'Error al cancelar el horario' 
      });
    }
  };
}
