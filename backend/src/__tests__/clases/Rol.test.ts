import { Rol } from '../../clases/Rol';

describe('Rol', () => {
  describe('getters', () => {
    it('obtenerNombre() retorna el nombre del rol', () => {
      // arrange
      const rol = new Rol('Admin', 'Administrador del sistema', 'rol-1');

      // act & assert
      expect(rol.obtenerNombre()).toBe('Admin');
    });

    it('obtenerDescripcion() retorna la descripción del rol', () => {
      // arrange
      const rol = new Rol('Admin', 'Administrador del sistema', 'rol-1');

      // act & assert
      expect(rol.obtenerDescripcion()).toBe('Administrador del sistema');
    });

    it('obtenerId() retorna el id del rol', () => {
      // arrange
      const rol = new Rol('Admin', 'Administrador del sistema', 'rol-99');

      // act & assert
      expect(rol.obtenerId()).toBe('rol-99');
    });
  });

  describe('esAdministrador()', () => {
    it('retorna true cuando el nombre es "admin" (case insensitive)', () => {
      // arrange
      const rol = new Rol('admin', 'Administrador');

      // act & assert
      expect(rol.esAdministrador()).toBe(true);
    });

    it('retorna true cuando el nombre es "Admin" (mayúscula)', () => {
      // arrange
      const rol = new Rol('Admin', 'Administrador');

      // act & assert
      expect(rol.esAdministrador()).toBe(true);
    });

    it('retorna false cuando el nombre es "cliente"', () => {
      // arrange
      const rol = new Rol('cliente', 'Cliente del sistema');

      // act & assert
      expect(rol.esAdministrador()).toBe(false);
    });

    it('retorna false cuando el nombre es "profesional"', () => {
      // arrange
      const rol = new Rol('profesional', 'Profesional del sistema');

      // act & assert
      expect(rol.esAdministrador()).toBe(false);
    });
  });

  describe('esProfesional()', () => {
    it('retorna true cuando el nombre es "profesional" (case insensitive)', () => {
      // arrange
      const rol = new Rol('profesional', 'Profesional del sistema');

      // act & assert
      expect(rol.esProfesional()).toBe(true);
    });

    it('retorna true cuando el nombre es "Profesional" (mayúscula)', () => {
      // arrange
      const rol = new Rol('Profesional', 'Profesional del sistema');

      // act & assert
      expect(rol.esProfesional()).toBe(true);
    });

    it('retorna false cuando el nombre es "cliente"', () => {
      // arrange
      const rol = new Rol('cliente', 'Cliente del sistema');

      // act & assert
      expect(rol.esProfesional()).toBe(false);
    });

    it('retorna false cuando el nombre es "admin"', () => {
      // arrange
      const rol = new Rol('admin', 'Administrador del sistema');

      // act & assert
      expect(rol.esProfesional()).toBe(false);
    });
  });
});
