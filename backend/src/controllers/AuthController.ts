import type { Request, Response } from 'express';

import { AuthService } from '../services/AuthService';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nombre, email, password } = req.body;
      const usuario = await this.authService.register(nombre, email, password);
      res.status(201).json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const token = await this.authService.login(email, password);
      res.json({ token });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  };
}
