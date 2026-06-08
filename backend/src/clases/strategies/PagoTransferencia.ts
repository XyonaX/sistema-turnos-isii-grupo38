import { DatosPago, EstadoPago, ResultadoPago } from '../../types/Pago';
import { PagoStrategy } from './PagoStrategy';

// Simulación: aprueba si el último dígito del CBU es par, rechaza si es impar o no numérico
export class PagoTransferencia implements PagoStrategy {
  async procesarPago(datosCliente: DatosPago): Promise<ResultadoPago> {
    const cbu = datosCliente.numeroTarjeta.replace(/\s/g, '');
    const ultimoDigito = parseInt(cbu[cbu.length - 1], 10);
    if (!isNaN(ultimoDigito) && ultimoDigito % 2 === 0) {
      return {
        exito: true,
        transactionId: `TRF-${Date.now()}`,
      };
    }
    return {
      exito: false,
      error: 'CBU inválido o transferencia rechazada.',
    };
  }

  async verificarEstado(_transactionId: string): Promise<EstadoPago> {
    return 'CONFIRMADO';
  }

  async cancelarPago(_transactionId: string): Promise<void> {
    // no-op
  }
}
