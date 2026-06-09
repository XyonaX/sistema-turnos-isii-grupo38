import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Actualizamos la interfaz para mapear el payload real del JWT
export interface AuthRequest extends Request {
  user?: { id: string; email: string; rol: string; nombre: string };
}

export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  console.log('[AuthMiddleware] Header de autorización recibido:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[AuthMiddleware] Rechazado: Token no proporcionado o formato inválido.');
    res.status(401).json({ message: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'secret';
    
    // Agregamos 'nombre' al casteo del token decodificado
    const payload = jwt.verify(token, secret) as {
      id: string;
      email: string;
      rol: string;
      nombre: string;
    };

    req.user = payload;
    console.log(`[AuthMiddleware] Token verificado. Usuario ID: ${payload.id}, Nombre: ${payload.nombre}, Rol: ${payload.rol}`);
    next();
  } catch (error: any) {
    console.error('[AuthMiddleware] Error al verificar el JWT:', error.message);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export const isProfesional = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.rol?.toLowerCase() !== 'profesional') {
    console.warn(`[AuthMiddleware] Acceso denegado: Se requiere rol profesional. Rol actual: ${req.user?.rol}`);
    res.status(403).json({ message: 'Acceso denegado' });
    return;
  }
  next();
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.rol?.toLowerCase() !== 'admin') {
    console.warn(`[AuthMiddleware] Acceso denegado: Se requiere rol administrador. Rol actual: ${req.user?.rol}`);
    res.status(403).json({ message: 'Acceso denegado: se requiere rol administrador' });
    return;
  }
  next();
};