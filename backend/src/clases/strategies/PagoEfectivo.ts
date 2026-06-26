import { DatosPago, EstadoPago, ResultadoPago } from '../../types/Pago';
import { PagoStrategy } from './PagoStrategy';

// Efectivo siempre se aprueba — el pago real se confirma presencialmente
export class PagoEfectivo implements PagoStrategy {
  async procesarPago(_datosCliente: DatosPago): Promise<ResultadoPago> {
    return {
      exito: true,
      transactionId: `EFE-${Date.now()}`,
    };
  }

  async verificarEstado(_transactionId: string): Promise<EstadoPago> {
    return 'CONFIRMADO';
  }

  async cancelarPago(_transactionId: string): Promise<void> {
    // no-op
  }
}
