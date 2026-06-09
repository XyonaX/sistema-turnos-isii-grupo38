import bcrypt from 'bcryptjs';
import { Servicio } from '../../clases/Servicio';
import { Usuario } from '../../clases/Usuario';
import { Rol } from '../../clases/Rol';

function crearProfesional(id = 'prof-1'): Usuario {
  const rol = new Rol('profesional', 'Profesional del sistema', 'rol-prof');
  const hash = bcrypt.hashSync('secret', 10);
  return new Usuario('Maria Lopez', 'maria@test.com', hash, rol, id);
}

function crearCliente(id = 'cli-1'): Usuario {
  const rol = new Rol('cliente', 'Cliente del sistema', 'rol-cli');
  const hash = bcrypt.hashSync('secret', 10);
  return new Usuario('Pedro Sanz', 'pedro@test.com', hash, rol, id);
}

describe('Servicio', () => {
  describe('constructor con datos válidos', () => {
    it('crea la instancia correctamente con un profesional', () => {
      // arrange
      const profesional = crearProfesional('prof-99');

      // act
      const servicio = new Servicio('Corte de pelo', profesional, 30, 500, 'Descripción', 'serv-1');

      // assert
      expect(servicio.obtenerId()).toBe('serv-1');
      expect(servicio.obtenerNombre()).toBe('Corte de pelo');
      expect(servicio.obtenerDuracionMinutos()).toBe(30);
      expect(servicio.obtenerPrecio()).toBe(500);
      expect(servicio.obtenerDescripcion()).toBe('Descripción');
      expect(servicio.obtenerProfesional()).toBe(profesional);
    });
  });

  describe('validaciones del constructor', () => {
    it('lanza error si el precio es negativo', () => {
      // arrange
      const profesional = crearProfesional();

      // act & assert
      expect(() => new Servicio('Corte', profesional, 30, -100)).toThrow(
        'El precio del servicio no puede ser un valor negativo'
      );
    });

    it('lanza error si la duración es 0 o negativa', () => {
      // arrange
      const profesional = crearProfesional();

      // act & assert
      expect(() => new Servicio('Corte', profesional, 0, 100)).toThrow(
        'La duración del servicio debe ser positiva'
      );
    });

    it('lanza error si el nombre está vacío', () => {
      // arrange
      const profesional = crearProfesional();

      // act & assert
      expect(() => new Servicio('', profesional, 30, 100)).toThrow(
        'El nombre del servicio es requerido'
      );
    });

    it('lanza error si el profesional tiene rol cliente (no puede ofrecer servicios)', () => {
      // arrange
      const cliente = crearCliente();

      // act & assert
      expect(() => new Servicio('Corte', cliente, 30, 100)).toThrow(
        'Solo los profesionales pueden crear o tener servicios asignados'
      );
    });
  });

  describe('validarSeguridadPropietario()', () => {
    it('no lanza error cuando el id coincide con el profesional dueño', () => {
      // arrange
      const profesional = crearProfesional('prof-5');
      const servicio = new Servicio('Masaje', profesional, 60, 1000);

      // act & assert
      expect(() => servicio.validarSeguridadPropietario('prof-5')).not.toThrow();
    });

    it('lanza error cuando el id no coincide con el profesional dueño', () => {
      // arrange
      const profesional = crearProfesional('prof-5');
      const servicio = new Servicio('Masaje', profesional, 60, 1000);

      // act & assert
      expect(() => servicio.validarSeguridadPropietario('prof-otro')).toThrow(
        'No tienes permiso para modificar o eliminar este servicio'
      );
    });
  });
});
