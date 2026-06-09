import bcrypt from 'bcryptjs';
import { AuthService } from '../../services/AuthService';
import { AppDataSource } from '../../config/database';

jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Set JWT_SECRET so jwt.sign doesn't fail
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '24h';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsuarioRepo = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRolRepo = {
    findOneBy: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // First call → usuarioRepo, second call → rolRepo
    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(mockUsuarioRepo)
      .mockReturnValueOnce(mockRolRepo);

    service = new AuthService();
  });

  // ---------------------------------------------------------------------------
  describe('register()', () => {
    it('happy path: crea usuario con password hasheada y retorna { token, user }', async () => {
      const savedUser = {
        id: 'user-1',
        nombre: 'Juan',
        email: 'juan@test.com',
        passwordHash: 'hash',
        rol: { id: 'rol-1', nombre: 'cliente' },
      };

      mockUsuarioRepo.findOneBy.mockResolvedValue(null); // no existe
      mockRolRepo.findOneBy.mockResolvedValue({ id: 'rol-1', nombre: 'cliente' });
      mockUsuarioRepo.create.mockReturnValue(savedUser);
      mockUsuarioRepo.save.mockResolvedValue(savedUser);
      mockUsuarioRepo.findOne.mockResolvedValue(savedUser); // reload con relación rol

      const result = await service.register('Juan', 'juan@test.com', 'password123', 'cliente');

      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);

      expect(result.user).toMatchObject({
        id: 'user-1',
        nombre: 'Juan',
        email: 'juan@test.com',
        rol: 'cliente',
      });
    });

    it('email duplicado: lanza error con mensaje correcto', async () => {
      mockUsuarioRepo.findOneBy.mockResolvedValue({ id: 'existing', email: 'juan@test.com' });

      await expect(
        service.register('Juan', 'juan@test.com', 'password123', 'cliente')
      ).rejects.toThrow('El correo ya está registrado');
    });

    it('rol no encontrado: lanza error con mensaje correcto', async () => {
      mockUsuarioRepo.findOneBy.mockResolvedValue(null);
      mockRolRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.register('Juan', 'juan@test.com', 'password123', 'inexistente')
      ).rejects.toThrow('Rol "inexistente" no encontrado');
    });
  });

  // ---------------------------------------------------------------------------
  describe('login()', () => {
    it('happy path: usuario existe y password correcta → retorna { token, user }', async () => {
      const passwordHash = bcrypt.hashSync('password123', 10);

      const mockQB = {
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 'user-1',
          nombre: 'Maria',
          email: 'maria@test.com',
          passwordHash,
          rol: { id: 'rol-1', nombre: 'profesional', descripcion: 'Profesional' },
        }),
      };
      mockUsuarioRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.login('maria@test.com', 'password123');

      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
      expect(result.user).toMatchObject({
        id: 'user-1',
        nombre: 'Maria',
        email: 'maria@test.com',
        rol: 'profesional',
      });
    });

    it('email no existe: lanza error "Credenciales inválidas"', async () => {
      const mockQB = {
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUsuarioRepo.createQueryBuilder.mockReturnValue(mockQB);

      await expect(service.login('noexiste@test.com', 'password123')).rejects.toThrow(
        'Credenciales inválidas'
      );
    });

    it('password incorrecta: lanza error "Credenciales inválidas"', async () => {
      const passwordHash = bcrypt.hashSync('correcta', 10);

      const mockQB = {
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 'user-1',
          nombre: 'Maria',
          email: 'maria@test.com',
          passwordHash,
          rol: { id: 'rol-1', nombre: 'profesional', descripcion: 'Profesional' },
        }),
      };
      mockUsuarioRepo.createQueryBuilder.mockReturnValue(mockQB);

      await expect(service.login('maria@test.com', 'incorrecta')).rejects.toThrow(
        'Credenciales inválidas'
      );
    });
  });
});
