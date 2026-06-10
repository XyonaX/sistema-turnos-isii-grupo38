/**
 * GestorPago.test.ts
 *
 * GestorPago es un Singleton exportado como `gestorPago`.
 * Se testea via la instancia exportada.
 *
 * Dependencias mockeadas:
 *   - AppDataSource (TypeORM)
 *   - catalogRepository (getEstadoTurnoId, getEstadoFranjaId)
 */

import { AppDataSource } from '../../config/database';

jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    createQueryRunner: jest.fn(),
  },
}));

jest.mock('../../repositories/catalogRepository', () => ({
  getEstadoTurnoId: jest.fn().mockResolvedValue('estado-turno-id'),
  getEstadoFranjaId: jest.fn().mockResolvedValue('estado-franja-id'),
}));

// Import AFTER mocks are set
import { gestorPago } from '../../services/GestorPago';

describe('GestorPago (Singleton)', () => {
  const mockPagoRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTurnoRepo = {
    findOne: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      query: jest.fn(),
    },
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockPagoRepo);
    (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  describe('iniciarPago(turnoId)', () => {
    it('turno existe → crea registro Pago en BD → retorna { pagoId, plazoExpiracion }', async () => {
      jest.useFakeTimers();

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      const savedPago = {
        id: 'pago-abc-123',
        estado: 'ESPERANDO',
        intentos: 0,
        expiresAt,
      };

      mockPagoRepo.create.mockReturnValue(savedPago);
      mockPagoRepo.save.mockResolvedValue(savedPago);

      const result = await gestorPago.iniciarPago('turno-1');

      expect(result).toHaveProperty('pagoId');
      expect(typeof result.pagoId).toBe('string');
      expect(result.pagoId.length).toBeGreaterThan(0);
      expect(result.plazoExpiracion).toBeInstanceOf(Date);
      expect(result.plazoExpiracion.getTime()).toBeGreaterThan(Date.now());

      expect(mockPagoRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          turno: { id: 'turno-1' },
          estado: 'ESPERANDO',
          intentos: 0,
        })
      );
      expect(mockPagoRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  describe('procesarPago(pagoId, datosPago, metodoPago)', () => {
    const datosTarjetaExitosa = {
      numeroTarjeta: '4111111111110', // termina en 0 → aprobado por PagoCreditoDebito
      vencimiento: '12/26',
      cvv: '123',
    };

    const datosTarjetaFallida = {
      numeroTarjeta: '4111111111111', // termina en 1 → rechazada
      vencimiento: '12/26',
      cvv: '123',
    };

    const makePagoEntity = (intentos = 0, estado = 'ESPERANDO') => ({
      id: 'pago-1',
      estado,
      intentos,
      metodoPago: undefined,
      transactionId: undefined,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min en el futuro
      createdAt: new Date(),
      turno: {
        id: 'turno-1',
        pagoPendiente: true,
        franja: null,
        estadoTurno: { id: 'et-1', nombre: 'Pendiente' },
      },
    });

    it('ESPERANDO + tarjeta exitosa + credito_debito → { exito: true, turno }', async () => {
      const pagoEntity = makePagoEntity(0);

      // procesarPago calls getRepository(Pago) → mockPagoRepo
      // After commit, it calls getRepository(Turno) again for the reload
      // We use mockReturnValueOnce so the first call gets pagoRepo and the second also pagoRepo,
      // but the final reload call (after commit) gets a separate repo with the updated turno.
      const mockReloadRepo = {
        findOne: jest.fn().mockResolvedValue({
          id: 'turno-1',
          estadoTurno: { nombre: 'Confirmado' },
          cliente: null,
          franja: null,
          notificaciones: [],
        }),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockPagoRepo)  // first call inside procesarPago
        .mockReturnValue(mockReloadRepo);   // subsequent calls (Turno reload after commit)

      mockPagoRepo.findOne.mockResolvedValue(pagoEntity);
      mockPagoRepo.save.mockResolvedValue(pagoEntity);
      mockQueryRunner.manager.save.mockResolvedValue({});

      const result = await gestorPago.procesarPago('pago-1', datosTarjetaExitosa, 'credito_debito');

      expect(result.exito).toBe(true);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it('ESPERANDO + tarjeta fallida + intentos < 3 → { exito: false, puedoReintentar: true }', async () => {
      const pagoEntity = makePagoEntity(0);
      mockPagoRepo.findOne.mockResolvedValue(pagoEntity);
      mockPagoRepo.save.mockResolvedValue(pagoEntity);

      const result = await gestorPago.procesarPago('pago-1', datosTarjetaFallida, 'credito_debito');

      expect(result.exito).toBe(false);
      expect(result.puedoReintentar).toBe(true);
    });

    it('pago no encontrado → lanza error "Pago no encontrado"', async () => {
      mockPagoRepo.findOne.mockResolvedValue(null);

      await expect(
        gestorPago.procesarPago('pago-999', datosTarjetaExitosa, 'credito_debito')
      ).rejects.toThrow('Pago no encontrado');
    });

    it('pago ya procesado (CONFIRMADO) → lanza error con estado', async () => {
      const pagoConfirmado = makePagoEntity(1, 'CONFIRMADO');
      mockPagoRepo.findOne.mockResolvedValue(pagoConfirmado);

      await expect(
        gestorPago.procesarPago('pago-1', datosTarjetaExitosa, 'credito_debito')
      ).rejects.toThrow('El pago ya fue procesado (estado: CONFIRMADO)');
    });

    it('pago expirado → lanza error "El plazo de pago ha expirado"', async () => {
      const pagoExpirado = {
        ...makePagoEntity(0),
        expiresAt: new Date(Date.now() - 60 * 1000), // ya expiró
      };
      mockPagoRepo.findOne.mockResolvedValue(pagoExpirado);
      mockPagoRepo.save.mockResolvedValue(pagoExpirado);

      // rechazarPago/cancelarPagoYTurno también usa createQueryRunner
      (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);
      mockQueryRunner.manager.save.mockResolvedValue({});

      await expect(
        gestorPago.procesarPago('pago-1', datosTarjetaExitosa, 'credito_debito')
      ).rejects.toThrow('El plazo de pago ha expirado');
    });
  });

  // ---------------------------------------------------------------------------
  describe('rechazarPago(pagoId)', () => {
    const makePagoConTurno = (estado = 'ESPERANDO') => ({
      id: 'pago-1',
      estado,
      intentos: 0,
      metodoPago: undefined,
      transactionId: undefined,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
      turno: {
        id: 'turno-1',
        pagoPendiente: true,
        franja: { id: 'franja-1', fecha: '2099-12-31', horaInicio: '10:00', horaFin: '11:00' },
        estadoTurno: { id: 'et-1', nombre: 'Pendiente' },
        franjaFecha: undefined,
        franjaHoraInicio: undefined,
        franjaHoraFin: undefined,
      },
    });

    it('pago ESPERANDO → cancela pago y turno, llama commit', async () => {
      const pago = makePagoConTurno('ESPERANDO');
      mockPagoRepo.findOne.mockResolvedValue(pago);
      mockPagoRepo.save.mockResolvedValue(pago);
      mockQueryRunner.manager.save.mockResolvedValue({});
      mockQueryRunner.query.mockResolvedValue(undefined);

      await expect(gestorPago.rechazarPago('pago-1')).resolves.not.toThrow();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it('pago ya CONFIRMADO → no hace nada (retorna sin error)', async () => {
      const pagoConfirmado = makePagoConTurno('CONFIRMADO');
      mockPagoRepo.findOne.mockResolvedValue(pagoConfirmado);

      await expect(gestorPago.rechazarPago('pago-1')).resolves.not.toThrow();
      // cancelarPagoYTurno retorna early cuando !estaEsperando(), sin usar queryRunner
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('pago ya CANCELADO → no hace nada (retorna sin error)', async () => {
      const pagoCancelado = makePagoConTurno('CANCELADO');
      mockPagoRepo.findOne.mockResolvedValue(pagoCancelado);

      await expect(gestorPago.rechazarPago('pago-1')).resolves.not.toThrow();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });
});
