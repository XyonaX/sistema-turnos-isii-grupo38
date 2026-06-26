import { TurnoController } from '../../controllers/TurnoController';
import { TurnoService } from '../../services/TurnoService';
import { ReservaFacade } from '../../facades/ReservaFacade';

// Mock heavy dependencies that the controller imports at module level
jest.mock('../../services/TurnoService');
jest.mock('../../facades/ReservaFacade');
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Domain class mocks — constructor-only, no real logic needed
jest.mock('../../clases/Usuario', () => ({
  Usuario: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../../clases/FranjaHoraria', () => ({
  FranjaHoraria: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../../clases/Turno', () => ({
  Turno: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../../clases/Rol', () => ({
  Rol: jest.fn().mockImplementation(() => ({})),
}));

import { AppDataSource } from '../../config/database';

const mockRequest = (overrides: Record<string, any> = {}) =>
  ({
    body: {},
    params: {},
    query: {},
    user: { id: 'user-1', email: 'test@mail.com', nombre: 'Test', rol: 'CLIENTE' },
    ...overrides,
  } as any);

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Fake user entity returned by the repository inside reservar()
const fakeUsuarioEntity = {
  id: 'user-1',
  nombre: 'Test',
  email: 'test@mail.com',
  passwordHash: 'hash',
  rol: { id: 'r1', nombre: 'CLIENTE', descripcion: '' },
};

describe('TurnoController', () => {
  let controller: TurnoController;
  let mockUsuarioRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Provide a fake repo for the findOne call inside reservar()
    mockUsuarioRepo = {
      findOne: jest.fn().mockResolvedValue(fakeUsuarioEntity),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUsuarioRepo);

    controller = new TurnoController();
  });

  // =========================================================================
  // reservar()  — delegates to ReservaFacade.determinarReserva
  // =========================================================================
  describe('reservar()', () => {
    it('happy path: retorna 201 con turno, pagoId y plazoExpiracion', async () => {
      const fakeResult = {
        turno: { id: 't1' },
        pagoId: 'p1',
        plazoExpiracion: new Date('2025-01-01T10:05:00Z'),
      };
      (ReservaFacade.prototype.determinarReserva as jest.Mock).mockResolvedValue(fakeResult);

      const req = mockRequest({ body: { franjaId: 'f1', notas: 'Ninguna' } });
      const res = mockResponse();

      await controller.reservar(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        turno: fakeResult.turno,
        pagoId: fakeResult.pagoId,
        plazoExpiracion: fakeResult.plazoExpiracion,
      });
    });

    it('error cuando no se proporciona franjaId: retorna 400', async () => {
      const req = mockRequest({ body: { notas: 'Ninguna' } }); // franjaId ausente
      const res = mockResponse();

      await controller.reservar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Franja horaria no proporcionada.' })
      );
    });

    it('error cuando usuario no existe en BD: retorna 404', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue(null);

      const req = mockRequest({ body: { franjaId: 'f1' } });
      const res = mockResponse();

      await controller.reservar(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado.' });
    });

    it('error cuando la fachada rechaza: retorna 400', async () => {
      (ReservaFacade.prototype.determinarReserva as jest.Mock).mockRejectedValue(
        new Error('Franja no disponible')
      );

      const req = mockRequest({ body: { franjaId: 'f1' } });
      const res = mockResponse();

      await controller.reservar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Franja no disponible' });
    });
  });

  // =========================================================================
  // getMisTurnos()
  // =========================================================================
  describe('getMisTurnos()', () => {
    it('happy path: retorna la lista de turnos del usuario', async () => {
      const fakeTurnos = [{ id: 't1' }, { id: 't2' }];
      (TurnoService.prototype.getMisTurnos as jest.Mock).mockResolvedValue(fakeTurnos);

      const req = mockRequest();
      const res = mockResponse();

      await controller.getMisTurnos(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeTurnos);
    });

    it('error: retorna 500 cuando el servicio rechaza', async () => {
      (TurnoService.prototype.getMisTurnos as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      const req = mockRequest();
      const res = mockResponse();

      await controller.getMisTurnos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });

  // =========================================================================
  // cancelarMio()
  // =========================================================================
  describe('cancelarMio()', () => {
    it('happy path: retorna el turno cancelado', async () => {
      const fakeTurno = { id: 't1', estado: 'CANCELADO' };
      (TurnoService.prototype.cancelar as jest.Mock).mockResolvedValue(fakeTurno);

      const req = mockRequest({ params: { id: 't1' } });
      const res = mockResponse();

      await controller.cancelarMio(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeTurno);
    });

    it('error: retorna 400 cuando el servicio rechaza', async () => {
      (TurnoService.prototype.cancelar as jest.Mock).mockRejectedValue(
        new Error('No se puede cancelar')
      );

      const req = mockRequest({ params: { id: 't1' } });
      const res = mockResponse();

      await controller.cancelarMio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'No se puede cancelar' });
    });
  });

  // =========================================================================
  // getTodos()
  // =========================================================================
  describe('getTodos()', () => {
    it('happy path: retorna todos los turnos', async () => {
      const fakeTurnos = [{ id: 't1' }, { id: 't2' }, { id: 't3' }];
      (TurnoService.prototype.getTodos as jest.Mock).mockResolvedValue(fakeTurnos);

      const req = mockRequest();
      const res = mockResponse();

      await controller.getTodos(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeTurnos);
    });

    it('error: retorna 500 cuando el servicio rechaza', async () => {
      (TurnoService.prototype.getTodos as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = mockRequest();
      const res = mockResponse();

      await controller.getTodos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // =========================================================================
  // cancelarProfesional()
  // =========================================================================
  describe('cancelarProfesional()', () => {
    it('happy path: retorna el turno cancelado por profesional', async () => {
      const fakeTurno = { id: 't1', estado: 'CANCELADO' };
      (TurnoService.prototype.cancelarProfesional as jest.Mock).mockResolvedValue(fakeTurno);

      const req = mockRequest({ params: { id: 't1' } });
      const res = mockResponse();

      await controller.cancelarProfesional(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeTurno);
    });

    it('error con "permiso": retorna 403', async () => {
      (TurnoService.prototype.cancelarProfesional as jest.Mock).mockRejectedValue(
        new Error('Sin permiso para cancelar este turno')
      );

      const req = mockRequest({ params: { id: 't1' } });
      const res = mockResponse();

      await controller.cancelarProfesional(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('error sin "permiso": retorna 400', async () => {
      (TurnoService.prototype.cancelarProfesional as jest.Mock).mockRejectedValue(
        new Error('Turno no encontrado')
      );

      const req = mockRequest({ params: { id: 't1' } });
      const res = mockResponse();

      await controller.cancelarProfesional(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
