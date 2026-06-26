import { PagoTransferencia } from '../../../clases/strategies/PagoTransferencia';
import { DatosPago } from '../../../types/Pago';

const estrategia = new PagoTransferencia();

function datos(cbu: string): DatosPago {
  return { numeroTarjeta: cbu, vencimiento: '', cvv: '' };
}

describe('PagoTransferencia', () => {
  describe('procesarPago()', () => {
    it('retorna exito:true cuando el CBU termina en dígito par (2)', async () => {
      // arrange & act
      const resultado = await estrategia.procesarPago(datos('0000000000000000002'));

      // assert
      expect(resultado.exito).toBe(true);
      expect(resultado.transactionId).toMatch(/^TRF-/);
    });

    it('retorna exito:true cuando el CBU termina en 0', async () => {
      // arrange & act
      const resultado = await estrategia.procesarPago(datos('0000000000000000000'));

      // assert
      expect(resultado.exito).toBe(true);
    });

    it('retorna exito:false cuando el CBU termina en dígito impar (1)', async () => {
      // arrange & act
      const resultado = await estrategia.procesarPago(datos('0000000000000000001'));

      // assert
      expect(resultado.exito).toBe(false);
      expect(resultado.transactionId).toBeUndefined();
    });

    it('retorna exito:false cuando el CBU termina en dígito impar (7)', async () => {
      // arrange & act
      const resultado = await estrategia.procesarPago(datos('1234567890123456787'));

      // assert
      expect(resultado.exito).toBe(false);
    });
  });

  describe('verificarEstado()', () => {
    it('retorna un EstadoPago válido', async () => {
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
