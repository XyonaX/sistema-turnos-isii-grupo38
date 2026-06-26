import { TurnoService } from '../../services/TurnoService';
import { AppDataSource } from '../../config/database';

// ─── Mock de base de datos ───────────────────────────────────────────────────
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    createQueryRunner: jest.fn(),
    query: jest.fn(),
  },
}));

// ─── Mock del catálogo ────────────────────────────────────────────────────────
jest.mock('../../repositories/catalogRepository', () => ({
  getEstadoFranjaId: jest.fn().mockResolvedValue('estado-franja-id'),
  getEstadoTurnoId: jest.fn().mockResolvedValue('estado-turno-id'),
  getTipoNotificacionId: jest.fn().mockResolvedValue('tipo-notif-id'),
}));

// ─── Mock de GestorPago ───────────────────────────────────────────────────────
jest.mock('../../services/GestorPago', () => ({
  gestorPago: {
    iniciarPago: jest.fn(),
  },
}));

import { gestorPago } from '../../services/GestorPago';

describe('TurnoService', () => {
  let service: TurnoService;

  const mockTurnoRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockFranjaRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockNotificacionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      query: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(mockTurnoRepo)    // turnoRepo
      .mockReturnValueOnce(mockFranjaRepo)   // franjaRepo
      .mockReturnValueOnce(mockNotificacionRepo); // notificacionRepo

    (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);
    (AppDataSource.query as jest.Mock).mockResolvedValue(undefined);

    service = new TurnoService();
  });

  // Helper: turno entity mock
  const makeTurno = (id = 'turno-1', estadoNombre = 'Pendiente') => ({
    id,
    notas: undefined,
    creadoEn: new Date(),
    pagoPendiente: true,
    cliente: {
      id: 'cliente-1',
      nombre: 'Pedro',
      email: 'pedro@test.com',
      rol: { id: 'rol-1', nombre: 'cliente', descripcion: '' },
    },
    estadoTurno: { id: 'estado-turno-id', nombre: estadoNombre },
    franja: {
      id: 'franja-1',
      fecha: '2099-12-31',
      horaInicio: '10:00',
      horaFin: '11:00',
      estadoFranja: { id: 'estado-franja-id', nombre: 'Libre' },
      horario: { servicio: { profesional: { id: 'prof-1' } } },
    },
    notificaciones: [],
  });

  // Helper: franja entity mock
  const makeFranja = (estadoNombre = 'Libre') => ({
    id: 'franja-1',
    fecha: '2099-12-31',
    horaInicio: '10:00',
    horaFin: '11:00',
    motivoBloqueo: undefined,
    estadoFranja: { id: 'estado-franja-id', nombre: estadoNombre },
  });

  // ---------------------------------------------------------------------------
  describe('reservar()', () => {
    it('happy path: franja libre → crea turno → llama iniciarPago → retorna { turno, pagoId, plazoExpiracion }', async () => {
      const franja = makeFranja('Libre');
      const savedTurno = { id: 'turno-1' };
      const turnoGuardado = makeTurno('turno-1');
      const plazoExpiracion = new Date(Date.now() + 5 * 60 * 1000);

      mockQueryRunner.manager.findOne.mockResolvedValue(franja);
      mockQueryRunner.manager.create.mockReturnValue(savedTurno);
      mockQueryRunner.manager.save.mockResolvedValue(savedTurno);
      mockTurnoRepo.findOneOrFail.mockResolvedValue(turnoGuardado);
      (gestorPago.iniciarPago as jest.Mock).mockResolvedValue({
        pagoId: 'pago-123',
        plazoExpiracion,
      });
      mockNotificacionRepo.create.mockReturnValue({ mensaje: 'reservado' });

      const result = await service.reservar('cliente-1', 'franja-1', 'notas');

      expect(result).toHaveProperty('turno');
      expect(result).toHaveProperty('pagoId', 'pago-123');
      expect(result).toHaveProperty('plazoExpiracion', plazoExpiracion);
      expect(gestorPago.iniciarPago).toHaveBeenCalledWith('turno-1');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it('franja no encontrada: lanza error "Franja horaria no encontrada"', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.reservar('cliente-1', 'franja-999')).rejects.toThrow(
        'Franja horaria no encontrada'
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('franja no disponible (OCUPADA): lanza error "Franja horaria no disponible"', async () => {
      const franjaOcupada = makeFranja('Ocupada');
      mockQueryRunner.manager.findOne.mockResolvedValue(franjaOcupada);

      await expect(service.reservar('cliente-1', 'franja-1')).rejects.toThrow(
        'La franja horaria no se encuentra disponible para ser reservada.'
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  describe('getMisTurnos(clienteId)', () => {
    it('retorna array de turnos del cliente', async () => {
      const turnosPendientes: any[] = []; // vacío → actualizarTurnosCompletados no itera
      mockTurnoRepo.find
        .mockResolvedValueOnce(turnosPendientes)  // llamada de actualizarTurnosCompletados
        .mockResolvedValueOnce([makeTurno('t1'), makeTurno('t2')]); // llamada de getMisTurnos

      const result = await service.getMisTurnos('cliente-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  describe('cancelar(turnoId, clienteId)', () => {
    it('happy path: turno existe con suficiente anticipación → retorna turno cancelado', async () => {
      const turno = makeTurno('turno-1', 'Pendiente');
      // franja con fecha muy futura para superar la validación de 3h
      turno.franja = {
        ...turno.franja!,
        fecha: '2099-12-31',
        horaInicio: '10:00',
        horaFin: '11:00',
        estadoFranja: { id: 'estado-franja-id', nombre: 'Ocupada' },
      } as any;

      const turnoCancelado = { ...turno, estadoTurno: { nombre: 'Cancelado' } };

      mockTurnoRepo.findOne.mockResolvedValue(turno);
      mockTurnoRepo.save.mockResolvedValue(turnoCancelado);
      mockFranjaRepo.update.mockResolvedValue(undefined);
      mockNotificacionRepo.create.mockReturnValue({ mensaje: 'cancelado' });
      mockNotificacionRepo.save.mockResolvedValue(undefined);
      mockTurnoRepo.findOneOrFail.mockResolvedValue(turnoCancelado);

      const result = await service.cancelar('turno-1', 'cliente-1');

      expect(result).toBeDefined();
      expect(mockTurnoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('turno no encontrado: lanza error "Turno no encontrado"', async () => {
      mockTurnoRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelar('turno-999', 'cliente-1')).rejects.toThrow(
        'Turno no encontrado'
      );
    });

    it('turno ya cancelado: lanza error de dominio por estado finalizado', async () => {
      const turno = makeTurno('turno-1', 'Cancelado');
      turno.franja = null as any;
      mockTurnoRepo.findOne.mockResolvedValue(turno);

      // La clase de dominio Turno.cancelar() lanza antes de llegar al check del servicio
      await expect(service.cancelar('turno-1', 'cliente-1')).rejects.toThrow(
        'No se puede cancelar un turno que ya está finalizado como: Cancelado'
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe('getTurnoById(id)', () => {
    it('existe: retorna turno', async () => {
      const turno = makeTurno('turno-1');
      mockTurnoRepo.findOne.mockResolvedValue(turno);

      const result = await service.getTurnoById('turno-1');

      expect(result).toMatchObject({ id: 'turno-1' });
    });

    it('no existe: lanza error "Turno no encontrado"', async () => {
      mockTurnoRepo.findOne.mockResolvedValue(null);

      await expect(service.getTurnoById('turno-999')).rejects.toThrow('Turno no encontrado');
    });
  });
});
