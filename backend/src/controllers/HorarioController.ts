import type { Request, Response } from 'express';

import type { AuthRequest } from '../middlewares/AuthMiddleware';
import { HorarioService } from '../services/HorarioService';

export class HorarioController {
  private horarioService = new HorarioService();

  crear = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { servicioId, fechaInicio, fechaFin, horaApertura, horaCierre } = req.body;

      if (!servicioId || !fechaInicio || !fechaFin || !horaApertura || !horaCierre) {
        res.status(400).json({
          message:
            'Los campos servicioId, fechaInicio, fechaFin, horaApertura y horaCierre son requeridos',
        });
        return;
      }

      const franjas = await this.horarioService.crear(
        servicioId,
        fechaInicio,
        fechaFin,
        horaApertura,
        horaCierre
      );

      res.status(201).json(franjas);
    } catch (error: any) {
      console.error('Error creando horario:', error);
      res.status(400).json({
        message: error.message || 'Error al crear el horario',
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
        message: error.message || 'Error al obtener horarios',
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
        message: error.message || 'Error al obtener horarios',
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
        message: error.message || 'Error al actualizar disponibilidad',
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
        message: error.message || 'Error al cancelar el horario',
      });
    }
  };

  getMisFranjas = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const profesionalId = req.user?.id;
      if (!profesionalId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }
      const franjas = await this.horarioService.getFranjasByProfesional(profesionalId);
      res.json(franjas);
    } catch (error: any) {
      console.error('Error obteniendo franjas del profesional:', error);
      res.status(500).json({ message: error.message || 'Error al obtener los turnos' });
    }
  };
}
