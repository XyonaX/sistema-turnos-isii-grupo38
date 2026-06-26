// src/clases/Pago.ts
import { MetodoPago } from '../types/Pago';

export class Pago {
  // =========================================================================
  // ATRIBUTOS PRIVADOS
  // =========================================================================
  private id?: string;
  private turnoId: string;
  private estado: 'ESPERANDO' | 'CONFIRMADO' | 'CANCELADO';
  private metodoPago?: MetodoPago;
  private intentos: number;
  private transactionId?: string;
  private expiresAt: Date;
  private createdAt: Date;

  static readonly MAX_INTENTOS = 3;

  constructor(
    turnoId: string,
    expiresAt: Date,
    estado: 'ESPERANDO' | 'CONFIRMADO' | 'CANCELADO' = 'ESPERANDO',
    intentos: number = 0,
    metodoPago?: MetodoPago,
    transactionId?: string,
    createdAt?: Date,
    id?: string
  ) {
    this.id = id;
    this.turnoId = turnoId;
    this.estado = estado;
    this.metodoPago = metodoPago;
    this.intentos = intentos;
    this.transactionId = transactionId;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt || new Date();
  }

  // =========================================================================
  // GETTERS
  // =========================================================================
  public obtenerId(): string | undefined {
    return this.id;
  }

  public obtenerTurnoId(): string {
    return this.turnoId;
  }

  public obtenerEstado(): 'ESPERANDO' | 'CONFIRMADO' | 'CANCELADO' {
    return this.estado;
  }

  public obtenerMetodoPago(): MetodoPago | undefined {
    return this.metodoPago;
  }

  public obtenerIntentos(): number {
    return this.intentos;
  }

  public obtenerTransactionId(): string | undefined {
    return this.transactionId;
  }

  public obtenerExpiresAt(): Date {
    return this.expiresAt;
  }

  public obtenerCreatedAt(): Date {
    return this.createdAt;
  }

  // =========================================================================
  // REGLAS DE NEGOCIO
  // =========================================================================

  /** Devuelve true si el plazo de pago ya venció */
  public estaExpirado(): boolean {
    return new Date() > this.expiresAt;
  }

  /** Devuelve true si el pago todavía está en estado ESPERANDO */
  public estaEsperando(): boolean {
    return this.estado === 'ESPERANDO';
  }

  /**
   * El cliente puede reintentar el pago si:
   * - el pago sigue ESPERANDO,
   * - el plazo no venció, y
   * - no se agotaron los intentos.
   */
  public puedeReintentar(): boolean {
    return (
      this.estaEsperando() &&
      !this.estaExpirado() &&
      this.intentos < Pago.MAX_INTENTOS
    );
  }

  /**
   * Registra un nuevo intento de pago.
   * Precondición: el pago debe estar ESPERANDO y el plazo no debe haber vencido.
   */
  public registrarIntento(metodoPago: MetodoPago): void {
    if (!this.estaEsperando()) {
      throw new Error(`No se puede registrar un intento: el pago ya fue procesado (estado: ${this.estado})`);
    }
    if (this.estaExpirado()) {
      throw new Error('No se puede registrar un intento: el plazo de pago ha expirado');
    }
    this.intentos += 1;
    this.metodoPago = metodoPago;
  }

  /**
   * Confirma el pago exitoso.
   * Precondición: el pago debe estar ESPERANDO y el plazo no debe haber vencido.
   */
  public confirmar(transactionId: string): void {
    if (!this.estaEsperando()) {
      throw new Error(`No se puede confirmar el pago: ya fue procesado (estado: ${this.estado})`);
    }
    if (this.estaExpirado()) {
      throw new Error('No se puede confirmar el pago: el plazo ha expirado');
    }
    this.estado = 'CONFIRMADO';
    this.transactionId = transactionId;
  }

  /**
   * Cancela el pago (por rechazo del usuario o por expiración).
   * Precondición: el pago debe estar ESPERANDO.
   */
  public cancelar(): void {
    if (!this.estaEsperando()) {
      throw new Error(`No se puede cancelar el pago: ya fue procesado (estado: ${this.estado})`);
    }
    this.estado = 'CANCELADO';
  }
}
