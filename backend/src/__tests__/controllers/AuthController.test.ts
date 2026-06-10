import { AuthController } from '../../controllers/AuthController';
import { AuthService } from '../../services/AuthService';

jest.mock('../../services/AuthService');

const mockRequest = (overrides: Record<string, any> = {}) =>
  ({
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as any);

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController();
  });

  // =========================================================================
  // register()
  // =========================================================================
  describe('register()', () => {
    it('happy path: retorna 201 con token y usuario cuando el servicio resuelve', async () => {
      const fakeResult = {
        token: 'jwt-token',
        user: { id: 'u1', nombre: 'Juan', email: 'juan@mail.com', rol: 'CLIENTE' },
      };
      (AuthService.prototype.register as jest.Mock).mockResolvedValue(fakeResult);

      const req = mockRequest({
        body: { nombre: 'Juan', email: 'juan@mail.com', password: '1234', rol: 'CLIENTE' },
      });
      const res = mockResponse();

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeResult);
    });

    it('error: retorna 400 cuando el email ya está registrado', async () => {
      (AuthService.prototype.register as jest.Mock).mockRejectedValue(
        new Error('El correo ya está registrado')
      );

      const req = mockRequest({
        body: { nombre: 'Juan', email: 'dup@mail.com', password: '1234', rol: 'CLIENTE' },
      });
      const res = mockResponse();

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'El correo ya está registrado' });
    });
  });

  // =========================================================================
  // login()
  // =========================================================================
  describe('login()', () => {
    it('happy path: retorna 200 con token y usuario cuando las credenciales son válidas', async () => {
      const fakeResult = {
        token: 'jwt-token',
        user: { id: 'u1', nombre: 'Juan', email: 'juan@mail.com', rol: 'CLIENTE' },
      };
      (AuthService.prototype.login as jest.Mock).mockResolvedValue(fakeResult);

      const req = mockRequest({ body: { email: 'juan@mail.com', password: '1234' } });
      const res = mockResponse();

      await controller.login(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeResult);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('error: retorna 401 cuando las credenciales son inválidas', async () => {
      (AuthService.prototype.login as jest.Mock).mockRejectedValue(
        new Error('Credenciales inválidas')
      );

      const req = mockRequest({ body: { email: 'x@mail.com', password: 'wrong' } });
      const res = mockResponse();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
    });
  });

  // =========================================================================
  // logout()
  // =========================================================================
  describe('logout()', () => {
    it('siempre retorna 200 con mensaje de cierre de sesión', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await controller.logout(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Sesión cerrada correctamente' });
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
