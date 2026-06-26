export interface DatosPago {
  numeroTarjeta: string;
  vencimiento: string;
  cvv: string;
}

export interface ResultadoPago {
  exito: boolean;
  transactionId?: string;
  error?: string;
}

export type EstadoPago = 'ESPERANDO' | 'CONFIRMADO' | 'CANCELADO';
export type MetodoPago = 'credito_debito' | 'transferencia' | 'efectivo';

export interface PagoSesion {
  pagoId: string;
  turnoId: string;
  plazoExpiracion: Date;
}
