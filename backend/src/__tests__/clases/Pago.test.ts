import { Pago } from '../../clases/Pago';
import { MetodoPago } from '../../types/Pago';

const metodoPago: MetodoPago = 'credito_debito';

function fechaFutura(segundos = 3600): Date {
  return new Date(Date.now() + segundos * 1000);
}

function fechaPasada(segundos = 3600): Date {
  return new Date(Date.now() - segundos * 1000);
}

describe('Pago', () => {
  describe('estaExpirado()', () => {
    it('retorna true cuando la fecha de expiración ya pasó', () => {
      // arrange
      const pago = new Pago('turno-1', fechaPasada());

      // act & assert
      expect(pago.estaExpirado()).toBe(true);
    });

    it('retorna false cuando la fecha de expiración es futura', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura());

      // act & assert
      expect(pago.estaExpirado()).toBe(false);
    });
  });

  describe('estaEsperando()', () => {
    it('retorna true cuando el estado es ESPERANDO', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura(), 'ESPERANDO');

      // act & assert
      expect(pago.estaEsperando()).toBe(true);
    });

    it('retorna false cuando el estado es CONFIRMADO', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura(), 'CONFIRMADO');

      // act & assert
      expect(pago.estaEsperando()).toBe(false);
    });
  });

  describe('puedeReintentar()', () => {
    it('retorna true cuando los intentos son menores a MAX_INTENTOS y el pago no está expirado', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura(), 'ESPERANDO', Pago.MAX_INTENTOS - 1);

      // act & assert
      expect(pago.puedeReintentar()).toBe(true);
    });

    it('retorna false cuando los intentos son iguales a MAX_INTENTOS', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura(), 'ESPERANDO', Pago.MAX_INTENTOS);

      // act & assert
      expect(pago.puedeReintentar()).toBe(false);
    });

    it('retorna false cuando el pago está expirado', () => {
      // arrange
      const pago = new Pago('turno-1', fechaPasada(), 'ESPERANDO', 0);

      // act & assert
      expect(pago.puedeReintentar()).toBe(false);
    });
  });

  describe('registrarIntento()', () => {
    it('incrementa el contador de intentos en 1', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura(), 'ESPERANDO', 0);

      // act
      pago.registrarIntento(metodoPago);

      // assert
      expect(pago.obtenerIntentos()).toBe(1);
    });

    it('incrementa el método de pago registrado', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura(), 'ESPERANDO', 0);

      // act
      pago.registrarIntento('transferencia');

      // assert
      expect(pago.obtenerMetodoPago()).toBe('transferencia');
    });

    it('lanza error si el pago ya fue procesado', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura(), 'CONFIRMADO', 1);

      // act & assert
      expect(() => pago.registrarIntento(metodoPago)).toThrow();
    });

    it('lanza error si el plazo ha expirado', () => {
      // arrange
      const pago = new Pago('turno-1', fechaPasada(), 'ESPERANDO', 0);

      // act & assert
      expect(() => pago.registrarIntento(metodoPago)).toThrow();
    });
  });

  describe('confirmar()', () => {
    it('cambia el estado a CONFIRMADO y setea el transactionId', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura());
      const txId = 'TX-123';

      // act
      pago.confirmar(txId);

      // assert
      expect(pago.obtenerEstado()).toBe('CONFIRMADO');
      expect(pago.obtenerTransactionId()).toBe(txId);
    });

    it('lanza error si el pago ya fue confirmado previamente', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura(), 'CONFIRMADO');

      // act & assert
      expect(() => pago.confirmar('TX-456')).toThrow();
    });

    it('lanza error si el plazo ya expiró', () => {
      // arrange
      const pago = new Pago('turno-1', fechaPasada());

      // act & assert
      expect(() => pago.confirmar('TX-789')).toThrow();
    });
  });

  describe('cancelar()', () => {
    it('cambia el estado a CANCELADO', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura());

      // act
      pago.cancelar();

      // assert
      expect(pago.obtenerEstado()).toBe('CANCELADO');
    });

    it('lanza error si el pago ya fue cancelado previamente', () => {
      // arrange
      const pago = new Pago('turno-1', fechaFutura(), 'CANCELADO');

      // act & assert
      expect(() => pago.cancelar()).toThrow();
    });
  });
});
