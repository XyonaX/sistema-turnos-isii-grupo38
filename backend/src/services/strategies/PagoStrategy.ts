import { DatosPago, EstadoPago, ResultadoPago } from '../../types/Pago';

export interface PagoStrategy {
  procesarPago(datosCliente: DatosPago): Promise<ResultadoPago>;
  verificarEstado(transactionId: string): Promise<EstadoPago>;
  cancelarPago(transactionId: string): Promise<void>;
}
