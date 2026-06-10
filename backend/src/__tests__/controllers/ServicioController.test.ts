import { ServicioController } from '../../controllers/ServicioController';
import { ServicioService } from '../../services/ServicioService';

jest.mock('../../services/ServicioService');

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

describe('ServicioController', () => {
  let controller: ServicioController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ServicioController();
  });

  // =========================================================================
  // listarTodos()
  // =========================================================================
  describe('listarTodos()', () => {
    it('happy path: retorna todos los servicios', async () => {
      const fakeServicios = [{ id: 's1', nombre: 'Corte' }, { id: 's2', nombre: 'Tinte' }];
      (ServicioService.prototype.listarTodos as jest.Mock).mockResolvedValue(fakeServicios);

      const req = mockRequest();
      const res = mockResponse();

      await controller.listarTodos(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeServicios);
    });

    it('error: retorna 500 cuando el servicio rechaza', async () => {
      (ServicioService.prototype.listarTodos as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      const req = mockRequest();
      const res = mockResponse();

      await controller.listarTodos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // =========================================================================
  // crear()
  // =========================================================================
  describe('crear()', () => {
    it('happy path: retorna 201 con el servicio creado', async () => {
      const fakeServicio = { id: 's1', nombre: 'Corte', precio: 500 };
      (ServicioService.prototype.crear as jest.Mock).mockResolvedValue(fakeServicio);

      const req = mockRequest({
        body: { nombre: 'Corte', descripcion: 'Corte de pelo', duracionMinutos: 30, precio: 500 },
      });
      const res = mockResponse();

      await controller.crear(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeServicio);
    });

    it('error: usuario no autenticado retorna 401', async () => {
      const req = mockRequest({ user: undefined });
      const res = mockResponse();

      await controller.crear(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
    });

    it('error: nombre faltante retorna 400', async () => {
      const req = mockRequest({ body: { descripcion: 'sin nombre' } });
      const res = mockResponse();

      await controller.crear(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'El nombre del servicio es requerido' });
    });

    it('error: servicio rechaza → retorna 400', async () => {
      (ServicioService.prototype.crear as jest.Mock).mockRejectedValue(
        new Error('Profesional no encontrado')
      );

      const req = mockRequest({ body: { nombre: 'Corte' } });
      const res = mockResponse();

      await controller.crear(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Profesional no encontrado' })
      );
    });
  });

  // =========================================================================
  // listar()  — servicios del profesional autenticado
  // =========================================================================
  describe('listar()', () => {
    it('happy path: retorna los servicios del profesional', async () => {
      const fakeServicios = [{ id: 's1', nombre: 'Corte' }];
      (ServicioService.prototype.listar as jest.Mock).mockResolvedValue(fakeServicios);

      const req = mockRequest();
      const res = mockResponse();

      await controller.listar(req, res);

      expect(ServicioService.prototype.listar).toHaveBeenCalledWith('prof-1');
      expect(res.json).toHaveBeenCalledWith(fakeServicios);
    });

    it('error: usuario no autenticado retorna 401', async () => {
      const req = mockRequest({ user: undefined });
      const res = mockResponse();

      await controller.listar(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('error: servicio rechaza → retorna 400', async () => {
      (ServicioService.prototype.listar as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = mockRequest();
      const res = mockResponse();

      await controller.listar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // =========================================================================
  // obtener()
  // =========================================================================
  describe('obtener()', () => {
    it('happy path: retorna el servicio solicitado', async () => {
      const fakeServicio = { id: 's1', nombre: 'Corte' };
      (ServicioService.prototype.obtener as jest.Mock).mockResolvedValue(fakeServicio);

      const req = mockRequest({ params: { id: 's1' } });
      const res = mockResponse();

      await controller.obtener(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeServicio);
    });

    it('no encontrado: retorna 404', async () => {
      (ServicioService.prototype.obtener as jest.Mock).mockRejectedValue(
        new Error('Servicio no encontrado')
      );

      const req = mockRequest({ params: { id: 'inexistente' } });
      const res = mockResponse();

      await controller.obtener(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('otro error: retorna 400', async () => {
      (ServicioService.prototype.obtener as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = mockRequest({ params: { id: 's1' } });
      const res = mockResponse();

      await controller.obtener(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // =========================================================================
  // actualizar()
  // =========================================================================
  describe('actualizar()', () => {
    it('happy path: retorna el servicio actualizado', async () => {
      const fakeServicio = { id: 's1', nombre: 'Corte Pro', precio: 700 };
      (ServicioService.prototype.actualizar as jest.Mock).mockResolvedValue(fakeServicio);

      const req = mockRequest({
        params: { id: 's1' },
        body: { nombre: 'Corte Pro', precio: 700 },
      });
      const res = mockResponse();

      await controller.actualizar(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeServicio);
    });

    it('error: usuario no autenticado retorna 401', async () => {
      const req = mockRequest({ user: undefined, params: { id: 's1' } });
      const res = mockResponse();

      await controller.actualizar(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('error: sin permiso retorna 403', async () => {
      (ServicioService.prototype.actualizar as jest.Mock).mockRejectedValue(
        new Error('No tenés permiso para modificar este servicio')
      );

      const req = mockRequest({ params: { id: 's1' }, body: {} });
      const res = mockResponse();

      await controller.actualizar(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('error genérico: retorna 400', async () => {
      (ServicioService.prototype.actualizar as jest.Mock).mockRejectedValue(
        new Error('Error de validación')
      );

      const req = mockRequest({ params: { id: 's1' }, body: {} });
      const res = mockResponse();

      await controller.actualizar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // =========================================================================
  // eliminar()
  // =========================================================================
  describe('eliminar()', () => {
    it('happy path: retorna mensaje de éxito', async () => {
      (ServicioService.prototype.eliminar as jest.Mock).mockResolvedValue(undefined);

      const req = mockRequest({ params: { id: 's1' } });
      const res = mockResponse();

      await controller.eliminar(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Servicio eliminado correctamente' });
    });

    it('error: usuario no autenticado retorna 401', async () => {
      const req = mockRequest({ user: undefined, params: { id: 's1' } });
      const res = mockResponse();

      await controller.eliminar(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('error: sin permiso retorna 403', async () => {
      (ServicioService.prototype.eliminar as jest.Mock).mockRejectedValue(
        new Error('No tenés permiso para eliminar este servicio')
      );

      const req = mockRequest({ params: { id: 's1' } });
      const res = mockResponse();

      await controller.eliminar(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('error genérico: retorna 400', async () => {
      (ServicioService.prototype.eliminar as jest.Mock).mockRejectedValue(
        new Error('Servicio no encontrado')
      );

      const req = mockRequest({ params: { id: 's1' } });
      const res = mockResponse();

      await controller.eliminar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
