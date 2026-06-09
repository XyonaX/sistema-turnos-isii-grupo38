import bcrypt from 'bcryptjs';
import { Usuario } from '../../clases/Usuario';
import { Rol } from '../../clases/Rol';

const PASSWORD = 'password123';

function rolCliente(): Rol {
  return new Rol('cliente', 'Rol de cliente', 'rol-cliente');
}

function rolProfesional(): Rol {
  return new Rol('profesional', 'Rol de profesional', 'rol-prof');
}

function crearUsuario(rol: Rol, id = 'user-1'): Usuario {
  const hash = bcrypt.hashSync(PASSWORD, 10);
  return new Usuario('Ana García', 'ana@test.com', hash, rol, id);
}

describe('Usuario', () => {
  describe('getters', () => {
    it('retornan los valores del constructor', () => {
      // arrange
      const rol = rolCliente();
      const usuario = crearUsuario(rol, 'user-42');

      // act & assert
      expect(usuario.obtenerId()).toBe('user-42');
      expect(usuario.obtenerNombre()).toBe('Ana García');
      expect(usuario.obtenerEmail()).toBe('ana@test.com');
      expect(usuario.obtenerRol()).toBe(rol);
    });
  });

  describe('constructor validaciones', () => {
    it('lanza error si el email no contiene "@"', () => {
      // arrange
      const hash = bcrypt.hashSync(PASSWORD, 10);
      const rol = rolCliente();

      // act & assert
      expect(() => new Usuario('Test', 'email-invalido', hash, rol)).toThrow(
        'El formato del correo electrónico no es válido'
      );
    });
  });

  describe('verificarContrasenia()', () => {
    it('retorna true con la contraseña correcta', async () => {
      // arrange
      const usuario = crearUsuario(rolCliente());

      // act
      const resultado = await usuario.verificarContrasenia(PASSWORD);

      // assert
      expect(resultado).toBe(true);
    });

    it('retorna false con una contraseña incorrecta', async () => {
      // arrange
      const usuario = crearUsuario(rolCliente());

      // act
      const resultado = await usuario.verificarContrasenia('contraseniaErronea');

      // assert
      expect(resultado).toBe(false);
    });
  });

  describe('puedeOfrecerServicios()', () => {
    it('retorna true cuando el rol es profesional', () => {
      // arrange
      const usuario = crearUsuario(rolProfesional());

      // act & assert
      expect(usuario.puedeOfrecerServicios()).toBe(true);
    });

    it('retorna false cuando el rol es cliente', () => {
      // arrange
      const usuario = crearUsuario(rolCliente());

      // act & assert
      expect(usuario.puedeOfrecerServicios()).toBe(false);
    });
  });
});
