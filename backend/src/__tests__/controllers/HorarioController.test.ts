import { HorarioController } from '../../controllers/HorarioController';
import { HorarioService } from '../../services/HorarioService';

jest.mock('../../services/HorarioService');

const mockRequest = (overrides: Record<string, any> = {}) =>
  ({
    body: {},
    params: {},
    query: {},
    user: { id: 'prof-1', email: 'prof@mail.com', nombre: 'Profesional', rol: 'PROFESIONAL' },
    ...overrides,
  } as any);

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('HorarioController', () => {
  let controller: HorarioController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new HorarioController();
  });

  // =========================================================================
  // crear()
  // =========================================================================
  describe('crear()', () => {
    const validBody = {
      servicioId: 's1',
      fechaInicio: '2025-02-01',
      fechaFin: '2025-02-28',
      horaApertura: '09:00',
      horaCierre: '18:00',
    };

    it('happy path: retorna 201 con las franjas creadas', async () => {
      const fakeFranjas = [{ id: 'f1' }, { id: 'f2' }];
      (HorarioService.prototype.crear as jest.Mock).mockResolvedValue(fakeFranjas);

      const req = mockRequest({ body: validBody });
      const res = mockResponse();

      await controller.crear(req, res);

      expect(HorarioService.prototype.crear).toHaveBeenCalledWith(
        validBody.servicioId,
        validBody.fechaInicio,
        validBody.fechaFin,
        validBody.horaApertura,
        validBody.horaCierre
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeFranjas);
    });

    it('error: campos faltantes retorna 400', async () => {
      const req = mockRequest({ body: { servicioId: 's1' } }); // faltan los demás campos
      const res = mockResponse();

      await controller.crear(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('requeridos') })
      );
    });

    it('error: servicio rechaza → retorna 400', async () => {
      (HorarioService.prototype.crear as jest.Mock).mockRejectedValue(
        new Error('Servicio no encontrado')
      );

      const req = mockRequest({ body: validBody });
      const res = mockResponse();

      await controller.crear(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Servicio no encontrado' })
      );
    });
  });

  // =========================================================================
  // getDisponibles()
  // =========================================================================
  describe('getDisponibles()', () => {
    it('happy path: retorna las franjas disponibles', async () => {
      const fakeFranjas = [{ id: 'f1', estado: 'LIBRE' }];
      (HorarioService.prototype.getDisponibles as jest.Mock).mockResolvedValue(fakeFranjas);

      const req = mockRequest();
      const res = mockResponse();

      await controller.getDisponibles(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeFranjas);
    });

    it('error: retorna 500 cuando el servicio rechaza', async () => {
      (HorarioService.prototype.getDisponibles as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      const req = mockRequest();
      const res = mockResponse();

      await controller.getDisponibles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // =========================================================================
  // getAll()
  // =========================================================================
  describe('getAll()', () => {
    it('happy path: retorna todas las franjas', async () => {
      const fakeFranjas = [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }];
      (HorarioService.prototype.getAll as jest.Mock).mockResolvedValue(fakeFranjas);

      const req = mockRequest();
      const res = mockResponse();

      await controller.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeFranjas);
    });

    it('error: retorna 500 cuando el servicio rechaza', async () => {
      (HorarioService.prototype.getAll as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = mockRequest();
      const res = mockResponse();

      await controller.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // =========================================================================
  // toggleDisponibilidad()
  // =========================================================================
  describe('toggleDisponibilidad()', () => {
    it('happy path: retorna la franja con disponibilidad alternada', async () => {
      const fakeHorario = { id: 'f1', disponible: false };
      (HorarioService.prototype.toggleDisponibilidad as jest.Mock).mockResolvedValue(fakeHorario);

      const req = mockRequest({ params: { id: 'f1' } });
      const res = mockResponse();

      await controller.toggleDisponibilidad(req, res);

      expect(HorarioService.prototype.toggleDisponibilidad).toHaveBeenCalledWith('f1');
      expect(res.json).toHaveBeenCalledWith(fakeHorario);
    });

    it('error: retorna 400 cuando el servicio rechaza', async () => {
      (HorarioService.prototype.toggleDisponibilidad as jest.Mock).mockRejectedValue(
        new Error('Franja no encontrada')
      );

      const req = mockRequest({ params: { id: 'f1' } });
      const res = mockResponse();

      await controller.toggleDisponibilidad(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // =========================================================================
  // cancelar()
  // =========================================================================
  describe('cancelar()', () => {
    it('happy path: retorna mensaje de éxito', async () => {
      (HorarioService.prototype.cancelar as jest.Mock).mockResolvedValue(undefined);

      const req = mockRequest({ params: { id: 'f1' } });
      const res = mockResponse();

      await controller.cancelar(req, res);

      expect(HorarioService.prototype.cancelar).toHaveBeenCalledWith('f1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Horario cancelado correctamente' });
    });

    it('error: retorna 400 cuando el servicio rechaza', async () => {
      (HorarioService.prototype.cancelar as jest.Mock).mockRejectedValue(
        new Error('Franja no encontrada')
      );

      const req = mockRequest({ params: { id: 'f1' } });
      const res = mockResponse();

      await controller.cancelar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Franja no encontrada' })
      );
    });
  });

  // =========================================================================
  // getMisFranjas()
  // =========================================================================
  describe('getMisFranjas()', () => {
    it('happy path: retorna las franjas del profesional autenticado', async () => {
      const fakeFranjas = [{ id: 'f1' }, { id: 'f2' }];
      (HorarioService.prototype.getFranjasByProfesional as jest.Mock).mockResolvedValue(
        fakeFranjas
      );

      const req = mockRequest();
      const res = mockResponse();

      await controller.getMisFranjas(req, res);

      expect(HorarioService.prototype.getFranjasByProfesional).toHaveBeenCalledWith('prof-1');
      expect(res.json).toHaveBeenCalledWith(fakeFranjas);
    });

    it('error: usuario no autenticado retorna 401', async () => {
      const req = mockRequest({ user: undefined });
      const res = mockResponse();

      await controller.getMisFranjas(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
    });

    it('error: retorna 500 cuando el servicio rechaza', async () => {
      (HorarioService.prototype.getFranjasByProfesional as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      const req = mockRequest();
      const res = mockResponse();

      await controller.getMisFranjas(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
