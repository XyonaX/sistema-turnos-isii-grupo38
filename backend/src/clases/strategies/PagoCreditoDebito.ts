import { DatosPago, EstadoPago, ResultadoPago } from '../../types/Pago';
import { PagoStrategy } from './PagoStrategy';

// Simulación: aprueba si el número de tarjeta termina en 0, rechaza en cualquier otro caso
export class PagoCreditoDebito implements PagoStrategy {
  async procesarPago(datosCliente: DatosPago): Promise<ResultadoPago> {
    const numeroLimpio = datosCliente.numeroTarjeta.replace(/\s/g, '');
    if (numeroLimpio.endsWith('0')) {
      return {
        exito: true,
        transactionId: `CC-${Date.now()}`,
      };
    }
    return {
      exito: false,
      error: 'Tarjeta rechazada. Verificá los datos e intentá nuevamente.',
    };
  }

  async verificarEstado(_transactionId: string): Promise<EstadoPago> {
    return 'CONFIRMADO';
  }

  async cancelarPago(_transactionId: string): Promise<void> {
    // no-op
  }
}
