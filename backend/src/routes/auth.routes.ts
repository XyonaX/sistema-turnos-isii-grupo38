import { Router } from 'express';

import { AuthController } from '../controllers/AuthController';
import { RegisterDTO, LoginDTO } from '../dtos/auth.dto';
import { isAuthenticated } from '../middlewares/AuthMiddleware';
import { authLimiter } from '../middlewares/rateLimiter';
import { validateDTO } from '../middlewares/validateDTO';

const router = Router();
const controller = new AuthController();

router.post('/register', authLimiter, validateDTO(RegisterDTO), controller.register);
router.post('/login', authLimiter, validateDTO(LoginDTO), controller.login);
router.post('/logout', isAuthenticated, controller.logout);
router.post('/cambiar-rol', isAuthenticated, controller.cambiarRol);

export default router;
