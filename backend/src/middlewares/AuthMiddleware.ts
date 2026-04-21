import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; rol: string };
}

export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token no proporcionado' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      email: string;
      rol: string;
    };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export const isProfesional = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.rol !== 'profesional') {
    res.status(403).json({ message: 'Acceso denegado: se requiere rol profesional' });
    return;
  }
  next();
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.rol !== 'admin') {
    res.status(403).json({ message: 'Acceso denegado: se requiere rol administrador' });
    return;
  }
  next();
};
