// src/facades/ReservaFacade.ts
import { Turno as TurnoDominio } from '../clases/Turno';
import { Pago as PagoDominio } from '../clases/Pago';
import { FranjaHoraria as FranjaDominio } from '../clases/FranjaHoraria';
import { Usuario as UsuarioDominio } from '../clases/Usuario';
import type { DatosPago, MetodoPago } from '../types/Pago';

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

  public async procesarPago(
    pagoId: string,
    datosCliente: DatosPago,
    metodo: MetodoPago
  ): Promise<{ exito: boolean; turno?: any; error?: string; puedoReintentar?: boolean }> {
    return gestorPago.procesarPago(pagoId, datosCliente, metodo);
  }

  public async cancelarPago(pagoId: string): Promise<void> {
    await gestorPago.rechazarPago(pagoId);
  }

  /**
   * Encapsula la cancelación realizada por un profesional.
   */
  public async cancelarProfesional(turno: TurnoDominio, profesionalId: string): Promise<void> {
    this.turno = turno;

    await this.turnoService.cancelarProfesional(turno.obtenerId()!, profesionalId);

    if (this.pago) {
      this.pago.cancelar();
    }
  }

  /**
   * Encapsula la cancelación realizada por un cliente.
   */
  public async cancelarCliente(turno: TurnoDominio, clienteId: string): Promise<void> {
    this.turno = turno;

    await this.turnoService.cancelar(turno.obtenerId()!, clienteId);

    if (this.pago) {
      this.pago.cancelar();
    }
  }

  public obtenerPago(): PagoDominio | undefined {
    return this.pago;
  }
}