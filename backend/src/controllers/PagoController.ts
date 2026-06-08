import type { Response } from 'express';

import type { AuthRequest } from '../middlewares/AuthMiddleware';
import { gestorPago } from '../services/GestorPago';
import { MetodoPago } from '../types/Pago';

export class PagoController {
  // Toda la lógica de pago vive en GestorPago — acá solo validamos parámetros y delegamos
  procesar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { pagoId, datosCliente, metodoPago } = req.body as {
        pagoId: string;
        datosCliente: { numeroTarjeta: string; vencimiento: string; cvv: string };
        metodoPago: MetodoPago;
      };

      if (!pagoId || !datosCliente || !metodoPago) {
        res
          .status(400)
          .json({ message: 'Faltan parámetros requeridos: pagoId, datosCliente, metodoPago' });
        return;
      }

      const resultado = await gestorPago.procesarPago(pagoId, datosCliente, metodoPago);
      res.json(resultado);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // El front llama a esto cuando el usuario abandona el formulario de pago
  cancelar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { pagoId } = req.body as { pagoId: string };

      if (!pagoId) {
        res.status(400).json({ message: 'Falta parámetro requerido: pagoId' });
        return;
      }

      await gestorPago.rechazarPago(pagoId);
      res.json({ message: 'Pago cancelado correctamente' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
