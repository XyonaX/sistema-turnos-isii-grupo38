import { HorarioService } from '../../services/HorarioService';
import { AppDataSource } from '../../config/database';

jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  },
}));

jest.mock('../../repositories/catalogRepository', () => ({
  getEstadoFranjaId: jest.fn().mockResolvedValue('estado-libre-id'),
}));

describe('HorarioService', () => {
  let service: HorarioService;

  const mockHorarioRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockFranjaRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockServicioRepo = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(mockHorarioRepo)
      .mockReturnValueOnce(mockFranjaRepo)
      .mockReturnValueOnce(mockServicioRepo);

    service = new HorarioService();
  });

  // Helper: franja entity
  const makeFranja = (id = 'franja-1', estadoNombre = 'Libre') => ({
    id,
    fecha: '2099-06-10',
    horaInicio: '09:00',
    horaFin: '10:00',
    motivoBloqueo: undefined,
    estadoFranja: { id: 'estado-id', nombre: estadoNombre },
  });

  // ---------------------------------------------------------------------------
  describe('getDisponibles()', () => {
    it('retorna array de franjas libres (via createQueryBuilder)', async () => {
      const franjas = [makeFranja('f1'), makeFranja('f2')];

      const mockQB = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(franjas),
      };
      mockFranjaRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getDisponibles();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('retorna array vacío si no hay franjas disponibles', async () => {
      const mockQB = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockFranjaRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getDisponibles();

      expect(result).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  describe('getAll()', () => {
    it('retorna todas las franjas', async () => {
      const franjas = [makeFranja('f1'), makeFranja('f2'), makeFranja('f3')];
      mockFranjaRepo.find.mockResolvedValue(franjas);

      const result = await service.getAll();

      expect(result).toHaveLength(3);
      expect(mockFranjaRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  describe('toggleDisponibilidad(id)', () => {
    it('franja LIBRE → cambia a BLOQUEADA y retorna franja actualizada', async () => {
      const franja = makeFranja('f1', 'Libre');
      const updated = { ...franja, estadoFranja: { id: 'estado-bloqueada-id', nombre: 'Bloqueada' } };

      mockFranjaRepo.findOne.mockResolvedValue(franja);
      mockFranjaRepo.save.mockResolvedValue(updated);

      const { getEstadoFranjaId } = require('../../repositories/catalogRepository');
      getEstadoFranjaId.mockResolvedValue('estado-bloqueada-id');

      const result = await service.toggleDisponibilidad('f1');

      expect(result).toBeDefined();
      expect(mockFranjaRepo.save).toHaveBeenCalledTimes(1);
    });

    it('franja BLOQUEADA → cambia a LIBRE y retorna franja actualizada', async () => {
      const franja = makeFranja('f1', 'Bloqueada');
      const updated = { ...franja, estadoFranja: { id: 'estado-libre-id', nombre: 'Libre' } };

      mockFranjaRepo.findOne.mockResolvedValue(franja);
      mockFranjaRepo.save.mockResolvedValue(updated);

      const { getEstadoFranjaId } = require('../../repositories/catalogRepository');
      getEstadoFranjaId.mockResolvedValue('estado-libre-id');

      const result = await service.toggleDisponibilidad('f1');

      expect(result).toBeDefined();
      expect(mockFranjaRepo.save).toHaveBeenCalledTimes(1);
    });

    it('franja OCUPADA: lanza error de negocio (no se puede modificar)', async () => {
      const franja = makeFranja('f1', 'Ocupada');
      mockFranjaRepo.findOne.mockResolvedValue(franja);

      await expect(service.toggleDisponibilidad('f1')).rejects.toThrow(
        'No se puede modificar la disponibilidad de una franja horaria que ya está ocupada por un turno activo.'
      );
    });

    it('franja no existe: lanza error "Franja horaria no encontrada"', async () => {
      mockFranjaRepo.findOne.mockResolvedValue(null);

      await expect(service.toggleDisponibilidad('franja-999')).rejects.toThrow(
        'Franja horaria no encontrada'
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe('cancelar(id)', () => {
    it('franja existe → llama a remove del repo', async () => {
      const franja = makeFranja('f1');
      mockFranjaRepo.findOneBy.mockResolvedValue(franja);
      mockFranjaRepo.remove.mockResolvedValue(undefined);

      await expect(service.cancelar('f1')).resolves.not.toThrow();
      expect(mockFranjaRepo.remove).toHaveBeenCalledWith(franja);
    });

    it('franja no existe: lanza error "Franja horaria no encontrada"', async () => {
      mockFranjaRepo.findOneBy.mockResolvedValue(null);

      await expect(service.cancelar('franja-999')).rejects.toThrow(
        'Franja horaria no encontrada'
      );
    });
  });
});
