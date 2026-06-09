import { Turno } from '../../clases/Turno';
import { Usuario } from '../../clases/Usuario';
import { Rol } from '../../clases/Rol';
import bcrypt from 'bcryptjs';

function crearUsuarioCliente(): Usuario {
  const rol = new Rol('cliente', 'Rol de cliente', 'rol-1');
  const hash = bcrypt.hashSync('password123', 10);
  return new Usuario('Juan Perez', 'juan@test.com', hash, rol, 'user-1');
}

describe('Turno', () => {
  describe('confirmar()', () => {
    it('cambia el estado a Confirmado cuando el turno está en Pendiente', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Pendiente');

      // act
      turno.confirmar();

      // assert
      expect(turno.obtenerNombreEstado()).toBe('Confirmado');
    });

    it('lanza error si el turno no está en estado Pendiente', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Confirmado');

      // act & assert
      expect(() => turno.confirmar()).toThrow();
    });
  });

  describe('cancelar()', () => {
    it('cambia el estado a Cancelado cuando se cancela por Cliente', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Pendiente');

      // act
      turno.cancelar('Cliente');

      // assert
      expect(turno.obtenerNombreEstado()).toBe('Cancelado');
    });

    it('cambia el estado a Cancelado cuando se cancela por Profesional', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Confirmado');

      // act
      turno.cancelar('Profesional');

      // assert
      expect(turno.obtenerNombreEstado()).toBe('Cancelado');
    });

    it('registra en notas quién canceló el turno', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Pendiente', 'Nota inicial');

      // act
      turno.cancelar('Cliente');

      // assert
      expect(turno.obtenerNotas()).toContain('[Cancelado por: Cliente]');
    });

    it('lanza error si el turno ya está Cancelado', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Cancelado');

      // act & assert
      expect(() => turno.cancelar('Cliente')).toThrow();
    });

    it('lanza error si el turno ya está Completado', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Completado');

      // act & assert
      expect(() => turno.cancelar('Profesional')).toThrow();
    });
  });

  describe('completar()', () => {
    it('cambia el estado a Completado cuando el turno está Confirmado', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Confirmado');

      // act
      turno.completar();

      // assert
      expect(turno.obtenerNombreEstado()).toBe('Completado');
    });

    it('lanza error si el turno no está Confirmado', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Pendiente');

      // act & assert
      expect(() => turno.completar()).toThrow();
    });
  });

  describe('marcarAusente()', () => {
    it('cambia el estado a No Asistio cuando el turno está Confirmado', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Confirmado');

      // act
      turno.marcarAusente();

      // assert
      expect(turno.obtenerNombreEstado()).toBe('No Asistio');
    });

    it('lanza error si el turno no está Confirmado', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Pendiente');

      // act & assert
      expect(() => turno.marcarAusente()).toThrow();
    });
  });

  describe('obtenerNombreEstado()', () => {
    it('retorna el estado actual como string', () => {
      // arrange
      const turno = new Turno(crearUsuarioCliente(), 'Pendiente');

      // act & assert
      expect(turno.obtenerNombreEstado()).toBe('Pendiente');
    });
  });
});
