// src/facades/ReservaFacade.ts
import { Turno as TurnoDominio } from '../clases/Turno';
import { Pago as PagoDominio } from '../clases/Pago';
import { FranjaHoraria as FranjaDominio } from '../clases/FranjaHoraria';
import { Usuario as UsuarioDominio } from '../clases/Usuario';
import { MetodoPago } from '../types/Pago';

// Importamos tus servicios e infraestructura
import { TurnoService } from '../services/TurnoService';
import { gestorPago } from '../services/GestorPago';

export class ReservaFacade {
  // =========================================================================
  // ATRIBUTOS PRIVADOS (Según tu diagrama UML)
  // =========================================================================
  private turno?: TurnoDominio;
  private pago?: PagoDominio;
  private franja?: FranjaDominio;
  private cliente?: UsuarioDominio;

  private turnoService: TurnoService;

  constructor() {
    this.turnoService = new TurnoService();
  }

  // =========================================================================
  // MÉTODOS PÚBLICOS
  // =========================================================================

  /**
   * Encapsula la creación del turno e hidrata el modelo de dominio.
   * Retorna la estructura rica de base de datos requerida por el Frontend.
   */
  public async determinarReserva(
    cliente: UsuarioDominio, 
    franja: FranjaDominio, 
    notas: string = '' // Forzamos un string por defecto para evitar errores en TypeORM
  ): Promise<any> {
    this.cliente = cliente;
    this.franja = franja;

    // 1. Delegamos en el servicio original que ya maneja las transacciones y relaciones del Turno y Pago
    const resultado = await this.turnoService.reservar(
      cliente.obtenerId()!, 
      franja.obtenerId()!,
      notas
    );

    // resultado = { turno: TurnoEntity, pagoId: string, plazoExpiracion: Date }

    // 2. Hidratamos los objetos de dominio internos de la fachada para cumplir con la Cátedra
    this.turno = new TurnoDominio(
      cliente,
      'PENDIENTE',
      resultado.turno.notas,
      resultado.turno.creadoEn,
      resultado.turno.id
    );

    this.pago = new PagoDominio(
      resultado.turno.id,
      resultado.plazoExpiracion,
      'ESPERANDO',
      0,
      undefined,
      undefined,
      undefined,
      resultado.pagoId
    );

    // 3. Devolvemos el resultado con la entidad TypeORM completa para no romper el Frontend
    return resultado;
  }

  /**
   * Centraliza el procesamiento del pago con la estrategia elegida.
   */
  public async procesarPago(turno: TurnoDominio, metodo: MetodoPago): Promise<PagoDominio> {
    this.turno = turno;

    if (!this.pago) {
      throw new Error('No hay un proceso de pago activo para esta fachada.');
    }

    const datosClienteMock = {
      email: this.cliente?.obtenerEmail() || 'cliente@domain.com',
      numeroTarjeta: '4111111111111111', 
      vencimiento: '12/30', 
      cvv: '123' 
    };

    const resultado = await gestorPago.procesarPago(
      this.pago.obtenerId()!,
      datosClienteMock,
      metodo
    );

    if (!resultado.exito) {
      throw new Error(resultado.error || 'El pago no pudo ser procesado.');
    }

    this.pago.confirmar(resultado.turno.transactionId || 'TX-MOCK');
    return this.pago;
  }

  /**
   * Encapsula las cancelaciones.
   */
  public async cancelar(turno: TurnoDominio, profesionalId: string): Promise<void> {
    this.turno = turno;

    await this.turnoService.cancelarProfesional(turno.obtenerId()!, profesionalId);

    if (this.pago) {
      this.pago.cancelar();
    }
  }

  public obtenerPago(): PagoDominio | undefined {
    return this.pago;
  }
}