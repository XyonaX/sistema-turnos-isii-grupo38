import { AppDataSource } from '../config/database';
import { ESTADO_TURNO, ESTADO_FRANJA } from '../constants/catalog';
import { FranjaHoraria } from '../entities/FranjaHoraria';
import { Pago } from '../entities/Pago';
import { Turno } from '../entities/Turno';
import { getEstadoTurnoId, getEstadoFranjaId } from '../repositories/catalogRepository';
import type { DatosPago, MetodoPago } from '../types/Pago';
import { Turno as TurnoDominio } from '../clases/Turno';
import { Usuario as UsuarioDominio } from '../clases/Usuario';
import { Rol as RolDominio } from '../clases/Rol';

import { PagoCreditoDebito } from '../clases/strategies/PagoCreditoDebito';
import { PagoEfectivo } from '../clases/strategies/PagoEfectivo';
import { PagoTransferencia } from '../clases/strategies/PagoTransferencia';
import type { PagoStrategy } from '../clases/strategies/PagoStrategy';
import { Pago as PagoDominio } from '../clases/Pago';

const PLAZO_PAGO_MS = 30 * 1000; // 30 segundos (TEST — cambiar a 15 * 60 * 1000 en producción)

// Singleton que centraliza el ciclo de vida de los pagos en memoria.
// timerMap mantiene el setTimeout de expiración activo por cada pago pendiente.
class GestorPago {
  private timerMap: Map<string, NodeJS.Timeout> = new Map();

  // Se llama justo después del commit del turno para no mezclar el timer con la transacción principal
  async iniciarPago(turnoId: string): Promise<{ pagoId: string; plazoExpiracion: Date }> {
    const pagoRepo = AppDataSource.getRepository(Pago);

    const expiresAt = new Date(Date.now() + PLAZO_PAGO_MS);

    const pago = pagoRepo.create({
      turno: { id: turnoId },
      estado: 'ESPERANDO',
      intentos: 0,
      expiresAt,
    });

    const savedPago = await pagoRepo.save(pago);

    const timer = setTimeout(() => {
      this.expirarPago(savedPago.id).catch((err) => {
        console.error(`Error al expirar pago ${savedPago.id}:`, err);
      });
    }, PLAZO_PAGO_MS);

    this.timerMap.set(savedPago.id, timer);

    return { pagoId: savedPago.id, plazoExpiracion: expiresAt };
  }

  /**
   * Si el pago es exitoso: cancela el timer, confirma el pago y el turno en una sola transacción.
   * Si falla, devuelve puedoReintentar=true para que el cliente reintente dentro del plazo.
   */
  async procesarPago(
    pagoId: string,
    datosCliente: DatosPago,
    metodoPago: MetodoPago
  ): Promise<{ exito: boolean; turno?: any; error?: string; puedoReintentar?: boolean }> {
    const pagoRepo = AppDataSource.getRepository(Pago);

    const pago = await pagoRepo.findOne({
      where: { id: pagoId },
      relations: ['turno', 'turno.franja', 'turno.estadoTurno'],
    });

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    const pagoDominio = new PagoDominio(
      pago.turno.id,
      pago.expiresAt,
      pago.estado as any,
      pago.intentos,
      pago.metodoPago as any,
      pago.transactionId,
      pago.createdAt,
      pago.id
    );

    if (!pagoDominio.estaEsperando()) {
      throw new Error(`El pago ya fue procesado (estado: ${pago.estado})`);
    }

    if (pagoDominio.estaExpirado()) {
      await this.expirarPago(pago.id);
      throw new Error('El plazo de pago ha expirado');
    }

    pagoDominio.registrarIntento(metodoPago);
    pago.intentos = pagoDominio.obtenerIntentos();
    pago.metodoPago = metodoPago;
    await pagoRepo.save(pago);

    const strategy: PagoStrategy =
      metodoPago === 'credito_debito'
        ? new PagoCreditoDebito()
        : metodoPago === 'transferencia'
          ? new PagoTransferencia()
          : new PagoEfectivo();

    const resultado = await strategy.procesarPago(datosCliente);

    if (resultado.exito) {
      // Validar con dominio que el turno está en estado Pendiente antes de confirmarlo
      const rolDominio = new RolDominio(
        pago.turno.estadoTurno?.nombre || '', ''
      );
      const clienteDominio = new UsuarioDominio('', 'placeholder@domain.com', '', rolDominio);
      const turnoDominio = new TurnoDominio(
        clienteDominio,
        pago.turno.estadoTurno?.nombre || '',
      );
      turnoDominio.confirmar(); // lanza error si el turno no está en estado Pendiente

      // Cancelar el timer de expiración
      const timer = this.timerMap.get(pagoId);
      if (timer) {
        clearTimeout(timer);
        this.timerMap.delete(pagoId);
      }

      const estadoConfirmadoId = await getEstadoTurnoId(ESTADO_TURNO.CONFIRMADO);

      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        pagoDominio.confirmar(resultado.transactionId!);
        pago.estado = pagoDominio.obtenerEstado();
        pago.transactionId = pagoDominio.obtenerTransactionId();
        await queryRunner.manager.save(Pago, pago);

        const turno = pago.turno;
        turno.pagoPendiente = false;
        turno.estadoTurno = { id: estadoConfirmadoId } as any;
        await queryRunner.manager.save(Turno, turno);

        await queryRunner.commitTransaction();

        const turnoActualizado = await AppDataSource.getRepository(Turno).findOne({
          where: { id: turno.id },
          relations: {
            cliente: true,
            franja: { horario: { servicio: { profesional: true } }, estadoFranja: true },
            estadoTurno: true,
            notificaciones: { tipoNotificacion: true },
          },
        });

        return { exito: true, turno: turnoActualizado };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    return {
      exito: false,
      error: resultado.error,
      puedoReintentar: true,
    };
  }

  async rechazarPago(pagoId: string): Promise<void> {
    const timer = this.timerMap.get(pagoId);
    if (timer) {
      clearTimeout(timer);
      this.timerMap.delete(pagoId);
    }
    await this.cancelarPagoYTurno(pagoId);
  }

  // Callback del setTimeout — cuando el cliente no pagó en los 15 minutos
  private async expirarPago(pagoId: string): Promise<void> {
    this.timerMap.delete(pagoId);
    await this.cancelarPagoYTurno(pagoId);
  }

  /**
   * Cancela el pago y libera la franja. Nullificamos franjaId en el turno para
   * soltar el unique constraint — el UPDATE directo como garantía extra frente a TypeORM.
   */
  private async cancelarPagoYTurno(pagoId: string): Promise<void> {
    const pagoRepo = AppDataSource.getRepository(Pago);

    const pago = await pagoRepo.findOne({
      where: { id: pagoId },
      relations: ['turno', 'turno.franja'],
    });

    if (!pago) return;

    const pagoDominio = new PagoDominio(
      pago.turno.id,
      pago.expiresAt,
      pago.estado as any,
      pago.intentos,
      pago.metodoPago as any,
      pago.transactionId,
      pago.createdAt,
      pago.id
    );

    // Si ya fue confirmado o cancelado, no hacer nada
    if (!pagoDominio.estaEsperando()) return;

    const estadoCanceladoId = await getEstadoTurnoId(ESTADO_TURNO.CANCELADO);
    const estadoLibreId = await getEstadoFranjaId(ESTADO_FRANJA.LIBRE);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      pagoDominio.cancelar();
      pago.estado = pagoDominio.obtenerEstado();
      await queryRunner.manager.save(Pago, pago);

      const turno = pago.turno;
      const franjaId = turno.franja?.id;

      turno.estadoTurno = { id: estadoCanceladoId } as any;
      turno.franjaFecha = turno.franja?.fecha ?? undefined;
      turno.franjaHoraInicio = turno.franja?.horaInicio ?? undefined;
      turno.franjaHoraFin = turno.franja?.horaFin ?? undefined;
      turno.franja = null;
      await queryRunner.manager.save(Turno, turno);

      // Garantizar que franjaId quede NULL (por si TypeORM no lo persistió)
      await queryRunner.query('UPDATE turnos SET franjaId = NULL WHERE id = ?', [turno.id]);

      if (franjaId) {
        await queryRunner.query('UPDATE franjas_horarias SET estadoFranjaId = ? WHERE id = ?', [
          estadoLibreId,
          franjaId,
        ]);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`Error al cancelar pago ${pagoId}:`, error);
    } finally {
      await queryRunner.release();
    }
  }
}

export const gestorPago = new GestorPago();
