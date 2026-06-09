import { PagoEfectivo } from '../../../clases/strategies/PagoEfectivo';
import { DatosPago } from '../../../types/Pago';

const estrategia = new PagoEfectivo();

const datosCualquiera: DatosPago = {
  numeroTarjeta: '0000000000',
  vencimiento: '00/00',
  cvv: '000',
};

describe('PagoEfectivo', () => {
  describe('procesarPago()', () => {
    it('siempre retorna exito:true', async () => {
      // arrange & act
      const resultado = await estrategia.procesarPago(datosCualquiera);

      // assert
      expect(resultado.exito).toBe(true);
    });

    it('incluye un transactionId con prefijo EFE-', async () => {
      // arrange & act
      const resultado = await estrategia.procesarPago(datosCualquiera);

      // assert
      expect(resultado.transactionId).toMatch(/^EFE-/);
    });
  });

  describe('verificarEstado()', () => {
    it('resuelve sin lanzar error y retorna un EstadoPago válido', async () => {
      // arrange
      const estadosValidos = ['ESPERANDO', 'CONFIRMADO', 'CANCELADO'];

      // act
      const estado = await estrategia.verificarEstado('TX-cualquiera');

      // assert
      expect(estadosValidos).toContain(estado);
    });
  });

  describe('cancelarPago()', () => {
    it('resuelve sin lanzar error', async () => {
      // arrange & act & assert
      await expect(estrategia.cancelarPago('TX-cualquiera')).resolves.toBeUndefined();
    });
  });
});
