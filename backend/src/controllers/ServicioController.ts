import type { Request, Response } from 'express';
import { ServicioService } from '../services/ServicioService';
import { AuthRequest } from '../middlewares/AuthMiddleware';

export class ServicioController {
  private servicioService = new ServicioService();

  listarTodos = async (_req: Request, res: Response): Promise<void> => {
    try {
      const servicios = await this.servicioService.listarTodos();
      res.json(servicios);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Error al listar servicios' });
    }
  };

  crear = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { nombre, descripcion, duracion, precio } = req.body;
      const profesionalId = req.user?.id;

      if (!profesionalId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      if (!nombre) {
        res.status(400).json({ message: 'El nombre del servicio es requerido' });
        return;
      }

      const servicio = await this.servicioService.crear(profesionalId, nombre, descripcion, duracion, precio);
      res.status(201).json(servicio);
    } catch (error: any) {
      console.error('Error creando servicio:', error);
      res.status(400).json({
        message: error.message || 'Error al crear el servicio',
      });
    }
  };

  listar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const profesionalId = req.user?.id;

      if (!profesionalId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      const servicios = await this.servicioService.listar(profesionalId);
      res.json(servicios);
    } catch (error: any) {
      console.error('Error listando servicios:', error);
      res.status(400).json({
        message: error.message || 'Error al listar servicios',
      });
    }
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'ID del servicio es requerido' });
        return;
      }

      const servicio = await this.servicioService.obtener(id);
      res.json(servicio);
    } catch (error: any) {
      console.error('Error obteniendo servicio:', error);
      res.status(error.message === 'Servicio no encontrado' ? 404 : 400).json({
        message: error.message || 'Error al obtener el servicio',
      });
    }
  };

  actualizar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const profesionalId = req.user?.id;

      if (!profesionalId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      if (!id) {
        res.status(400).json({ message: 'ID del servicio es requerido' });
        return;
      }

      const servicio = await this.servicioService.actualizar(id, profesionalId, req.body);
      res.json(servicio);
    } catch (error: any) {
      console.error('Error actualizando servicio:', error);
      res.status(error.message.includes('permiso') ? 403 : 400).json({
        message: error.message || 'Error al actualizar el servicio',
      });
    }
  };

  eliminar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const profesionalId = req.user?.id;

      if (!profesionalId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      if (!id) {
        res.status(400).json({ message: 'ID del servicio es requerido' });
        return;
      }

      await this.servicioService.eliminar(id, profesionalId);
      res.json({ message: 'Servicio eliminado correctamente' });
    } catch (error: any) {
      console.error('Error eliminando servicio:', error);
      res.status(error.message.includes('permiso') ? 403 : 400).json({
        message: error.message || 'Error al eliminar el servicio',
      });
    }
  };
}
