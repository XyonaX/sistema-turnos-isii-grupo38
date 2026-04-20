import type { Request, Response } from 'express';

import { AuthService } from '../services/AuthService';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nombre, email, password } = req.body;
      const result = await this.authService.register(nombre, email, password);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // El logout es principalmente una acción del cliente (eliminar token del localStorage)
      // En el servidor solo confirmamos que la sesión se ha cerrado
      res.json({ message: 'Sesión cerrada correctamente' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
