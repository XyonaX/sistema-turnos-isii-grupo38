import { PagoController } from '../../controllers/PagoController';

// gestorPago es un singleton exportado — lo mockeamos como objeto directamente
jest.mock('../../services/GestorPago', () => ({
  gestorPago: {
    procesarPago: jest.fn(),
    rechazarPago: jest.fn(),
    iniciarPago: jest.fn(),
  },
}));

import { gestorPago } from '../../services/GestorPago';

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

describe('PagoController', () => {
  let controller: PagoController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PagoController();
  });

  // =========================================================================
  // procesar()
  // =========================================================================
  describe('procesar()', () => {
    const validBody = {
      pagoId: 'pago-1',
      datosCliente: { numeroTarjeta: '4111111111111111', vencimiento: '12/30', cvv: '123' },
      metodoPago: 'credito_debito',
    };

    it('happy path: pago exitoso retorna json con exito=true y turno', async () => {
      const fakeResult = { exito: true, turno: { id: 't1', estado: 'CONFIRMADO' } };
      (gestorPago.procesarPago as jest.Mock).mockResolvedValue(fakeResult);

      const req = mockRequest({ body: validBody });
      const res = mockResponse();

      await controller.procesar(req, res);

      expect(gestorPago.procesarPago).toHaveBeenCalledWith(
        validBody.pagoId,
        validBody.datosCliente,
        validBody.metodoPago
      );
      expect(res.json).toHaveBeenCalledWith(fakeResult);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('pago rechazado: retorna json con exito=false y puedoReintentar=true', async () => {
      const fakeResult = { exito: false, error: 'Fondos insuficientes', puedoReintentar: true };
      (gestorPago.procesarPago as jest.Mock).mockResolvedValue(fakeResult);

      const req = mockRequest({ body: validBody });
      const res = mockResponse();

      await controller.procesar(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeResult);
    });

    it('faltan parámetros: retorna 400', async () => {
      const req = mockRequest({ body: { pagoId: 'p1' } }); // faltan datosCliente y metodoPago
      const res = mockResponse();

      await controller.procesar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Faltan parámetros') })
      );
    });

    it('error: servicio rechaza → retorna 400', async () => {
      (gestorPago.procesarPago as jest.Mock).mockRejectedValue(new Error('Pago no encontrado'));

      const req = mockRequest({ body: validBody });
      const res = mockResponse();

      await controller.procesar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Pago no encontrado' });
    });
  });

  // =========================================================================
  // cancelar()
  // =========================================================================
  describe('cancelar()', () => {
    it('happy path: retorna json con mensaje de cancelación', async () => {
      (gestorPago.rechazarPago as jest.Mock).mockResolvedValue(undefined);

      const req = mockRequest({ body: { pagoId: 'pago-1' } });
      const res = mockResponse();

      await controller.cancelar(req, res);

      expect(gestorPago.rechazarPago).toHaveBeenCalledWith('pago-1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Pago cancelado correctamente' });
    });

    it('falta pagoId: retorna 400', async () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      await controller.cancelar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Falta parámetro requerido: pagoId' });
    });

    it('error: servicio rechaza → retorna 500', async () => {
      (gestorPago.rechazarPago as jest.Mock).mockRejectedValue(new Error('Error interno'));

      const req = mockRequest({ body: { pagoId: 'pago-1' } });
      const res = mockResponse();

      await controller.cancelar(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error interno' });
    });
  });
});
