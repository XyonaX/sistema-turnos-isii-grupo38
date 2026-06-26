import { ServicioService } from '../../services/ServicioService';
import { AppDataSource } from '../../config/database';

jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('ServicioService', () => {
  let service: ServicioService;

  const mockServicioRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUsuarioRepo = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // First getRepository call → servicioRepo, second → usuarioRepo
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(mockServicioRepo)
      .mockReturnValueOnce(mockUsuarioRepo);

    service = new ServicioService();
  });

  // Helper: profesional entity mock
  const makeProfesional = (id = 'prof-1') => ({
    id,
    nombre: 'Ana Profesional',
    email: 'ana@test.com',
    passwordHash: 'hash',
    rol: { id: 'rol-prof', nombre: 'profesional', descripcion: 'Profesional' },
  });

  // Helper: servicio entity mock
  const makeServicio = (id = 'serv-1', profesionalId = 'prof-1') => ({
    id,
    nombre: 'Corte de pelo',
    descripcion: 'Desc',
    duracionMinutos: 60,
    precio: 500,
    profesional: makeProfesional(profesionalId),
  });

  // ---------------------------------------------------------------------------
  describe('crear()', () => {
    it('happy path: profesional existe → retorna entidad creada', async () => {
      const profesional = makeProfesional();
      const newServicio = makeServicio();

      mockUsuarioRepo.findOne.mockResolvedValue(profesional);
      mockServicioRepo.create.mockReturnValue(newServicio);
      mockServicioRepo.save.mockResolvedValue(newServicio);

      const result = await service.crear('prof-1', 'Corte de pelo', 'Desc', 60, 500);

      expect(result).toBeDefined();
      expect(result.nombre).toBe('Corte de pelo');
      expect(mockServicioRepo.save).toHaveBeenCalledTimes(1);
    });

    it('profesional no existe: lanza error "Profesional no encontrado"', async () => {
      mockUsuarioRepo.findOne.mockResolvedValue(null);

      await expect(service.crear('prof-999', 'Corte', 'Desc', 60, 500)).rejects.toThrow(
        'Profesional no encontrado'
      );
    });

    it('lanza error si profesional o nombre están vacíos', async () => {
      await expect(service.crear('', 'Corte', 'Desc', 60, 500)).rejects.toThrow(
        'Profesional ID y nombre son requeridos'
      );
      await expect(service.crear('prof-1', '', 'Desc', 60, 500)).rejects.toThrow(
        'Profesional ID y nombre son requeridos'
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe('listarTodos()', () => {
    it('retorna array de entidades', async () => {
      const lista = [makeServicio('s1'), makeServicio('s2')];
      mockServicioRepo.find.mockResolvedValue(lista);

      const result = await service.listarTodos();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('retorna array vacío cuando no hay servicios', async () => {
      mockServicioRepo.find.mockResolvedValue([]);

      const result = await service.listarTodos();

      expect(result).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  describe('listar(profesionalId)', () => {
    it('retorna array filtrado por profesional', async () => {
      const lista = [makeServicio('s1', 'prof-1'), makeServicio('s2', 'prof-1')];
      mockServicioRepo.find.mockResolvedValue(lista);

      const result = await service.listar('prof-1');

      expect(result).toHaveLength(2);
      expect(mockServicioRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { profesional: { id: 'prof-1' } } })
      );
    });

    it('lanza error si profesionalId está vacío', async () => {
      await expect(service.listar('')).rejects.toThrow('Profesional ID es requerido');
    });
  });

  // ---------------------------------------------------------------------------
  describe('obtener(id)', () => {
    it('existe: retorna entidad', async () => {
      const servicio = makeServicio();
      mockServicioRepo.findOne.mockResolvedValue(servicio);

      const result = await service.obtener('serv-1');

      expect(result).toMatchObject({ id: 'serv-1' });
    });

    it('no existe: lanza error "Servicio no encontrado"', async () => {
      mockServicioRepo.findOne.mockResolvedValue(null);

      await expect(service.obtener('serv-999')).rejects.toThrow('Servicio no encontrado');
    });

    it('lanza error si id está vacío', async () => {
      await expect(service.obtener('')).rejects.toThrow('Servicio ID es requerido');
    });
  });

  // ---------------------------------------------------------------------------
  describe('actualizar()', () => {
    it('happy path (propietario correcto): retorna entidad actualizada', async () => {
      const servicio = makeServicio('serv-1', 'prof-1');
      const updated = { ...servicio, nombre: 'Nuevo nombre' };

      mockServicioRepo.findOne.mockResolvedValue(servicio);
      mockServicioRepo.save.mockResolvedValue(updated);

      const result = await service.actualizar('serv-1', 'prof-1', { nombre: 'Nuevo nombre' });

      expect(result.nombre).toBe('Nuevo nombre');
      expect(mockServicioRepo.save).toHaveBeenCalledTimes(1);
    });

    it('propietario incorrecto: lanza error de autorización', async () => {
      const servicio = makeServicio('serv-1', 'prof-1');
      mockServicioRepo.findOne.mockResolvedValue(servicio);

      await expect(
        service.actualizar('serv-1', 'prof-otro', { nombre: 'Hack' })
      ).rejects.toThrow('No tienes permiso para modificar o eliminar este servicio');
    });

    it('servicio no encontrado: lanza error', async () => {
      mockServicioRepo.findOne.mockResolvedValue(null);

      await expect(service.actualizar('serv-999', 'prof-1', {})).rejects.toThrow(
        'Servicio no encontrado'
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe('eliminar()', () => {
    it('happy path: llama al método de borrado del repo', async () => {
      const servicio = makeServicio('serv-1', 'prof-1');
      mockServicioRepo.findOne.mockResolvedValue(servicio);
      mockServicioRepo.remove.mockResolvedValue(undefined);

      await expect(service.eliminar('serv-1', 'prof-1')).resolves.not.toThrow();
      expect(mockServicioRepo.remove).toHaveBeenCalledWith(servicio);
    });

    it('servicio no existe: lanza error', async () => {
      mockServicioRepo.findOne.mockResolvedValue(null);

      await expect(service.eliminar('serv-999', 'prof-1')).rejects.toThrow(
        'Servicio no encontrado'
      );
    });

    it('propietario incorrecto: lanza error', async () => {
      const servicio = makeServicio('serv-1', 'prof-1');
      mockServicioRepo.findOne.mockResolvedValue(servicio);

      await expect(service.eliminar('serv-1', 'prof-otro')).rejects.toThrow(
        'No tienes permiso para modificar o eliminar este servicio'
      );
    });
  });
});
