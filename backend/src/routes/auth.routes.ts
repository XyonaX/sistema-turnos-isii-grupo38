import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateDTO } from '../middlewares/validateDTO';
import { authLimiter } from '../middlewares/rateLimiter';
import { RegisterDTO, LoginDTO } from '../dtos/auth.dto';

const router = Router();
const controller = new AuthController();

router.post('/register', authLimiter, validateDTO(RegisterDTO), controller.register);
router.post('/login',    authLimiter, validateDTO(LoginDTO),    controller.login);

export default router;
