import { FranjaHoraria } from '../../clases/FranjaHoraria';

describe('FranjaHoraria', () => {
  describe('getters', () => {
    it('retornan los valores del constructor', () => {
      // arrange
      const franja = new FranjaHoraria('2026-12-01', '09:00', '10:00', 'Libre', undefined, 'franja-1');

      // act & assert
      expect(franja.obtenerId()).toBe('franja-1');
      expect(franja.obtenerFecha()).toBe('2026-12-01');
      expect(franja.obtenerHoraInicio()).toBe('09:00');
      expect(franja.obtenerHoraFin()).toBe('10:00');
      expect(franja.obtenerEstado()).toBe('Libre');
    });
  });

  describe('alternarDisponibilidad()', () => {
    it('cambia de Libre a Bloqueada', () => {
      // arrange
      const franja = new FranjaHoraria('2026-12-01', '09:00', '10:00', 'Libre');

      // act
      franja.alternarDisponibilidad();

      // assert
      expect(franja.obtenerEstado()).toBe('Bloqueada');
    });

    it('cambia de Bloqueada a Libre', () => {
      // arrange
      const franja = new FranjaHoraria('2026-12-01', '09:00', '10:00', 'Bloqueada');

      // act
      franja.alternarDisponibilidad();

      // assert
      expect(franja.obtenerEstado()).toBe('Libre');
    });

    it('limpia el motivoBloqueo al volver a Libre', () => {
      // arrange
      const franja = new FranjaHoraria('2026-12-01', '09:00', '10:00', 'Bloqueada', 'Bloqueada manualmente por el profesional');

      // act
      franja.alternarDisponibilidad();

      // assert
      expect(franja.obtenerMotivoBloqueo()).toBeUndefined();
    });

    it('lanza error si la franja está Ocupada', () => {
      // arrange
      const franja = new FranjaHoraria('2026-12-01', '09:00', '10:00', 'Ocupada');

      // act & assert
      expect(() => franja.alternarDisponibilidad()).toThrow();
    });
  });

  describe('ocupar()', () => {
    it('cambia el estado a Ocupada cuando está Libre', () => {
      // arrange
      const franja = new FranjaHoraria('2026-12-01', '09:00', '10:00', 'Libre');

      // act
      franja.ocupar();

      // assert
      expect(franja.obtenerEstado()).toBe('Ocupada');
    });

    it('lanza error si la franja no está Libre', () => {
      // arrange
      const franja = new FranjaHoraria('2026-12-01', '09:00', '10:00', 'Bloqueada');

      // act & assert
      expect(() => franja.ocupar()).toThrow();
    });
  });

  describe('liberar()', () => {
    it('cambia el estado a Libre desde cualquier estado', () => {
      // arrange
      const franja = new FranjaHoraria('2026-12-01', '09:00', '10:00', 'Ocupada');

      // act
      franja.liberar();

      // assert
      expect(franja.obtenerEstado()).toBe('Libre');
    });

    it('limpia el motivoBloqueo al liberar', () => {
      // arrange
      const franja = new FranjaHoraria('2026-12-01', '09:00', '10:00', 'Bloqueada', 'Algún motivo');

      // act
      franja.liberar();

      // assert
      expect(franja.obtenerMotivoBloqueo()).toBeUndefined();
    });
  });
});
