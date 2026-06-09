import { PagoCreditoDebito } from '../../../clases/strategies/PagoCreditoDebito';
import { DatosPago } from '../../../types/Pago';

const estrategia = new PagoCreditoDebito();

function datos(numeroTarjeta: string): DatosPago {
  return { numeroTarjeta, vencimiento: '12/28', cvv: '123' };
}

describe('PagoCreditoDebito', () => {
  describe('procesarPago()', () => {
    it('retorna exito:true y transactionId con prefijo CC- cuando la tarjeta termina en 0', async () => {
      // arrange & act
      const resultado = await estrategia.procesarPago(datos('4111111111111110'));

      // assert
      expect(resultado.exito).toBe(true);
      expect(resultado.transactionId).toMatch(/^CC-/);
    });

    it('retorna exito:false cuando la tarjeta termina en 5', async () => {
      // arrange & act
      const resultado = await estrategia.procesarPago(datos('4111111111111115'));

      // assert
      expect(resultado.exito).toBe(false);
      expect(resultado.transactionId).toBeUndefined();
    });

    it('retorna exito:true con tarjeta con espacios que termina en 0', async () => {
      // arrange & act
      const resultado = await estrategia.procesarPago(datos('4111 1111 1111 1110'));

      // assert
      expect(resultado.exito).toBe(true);
      expect(resultado.transactionId).toMatch(/^CC-/);
    });

    it('retorna exito:false con tarjeta con espacios que termina en dígito impar', async () => {
      // arrange & act
      const resultado = await estrategia.procesarPago(datos('4111 1111 1111 1113'));

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
