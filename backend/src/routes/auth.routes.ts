import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { isAuthenticated } from '../middlewares/AuthMiddleware';

const router = Router();
const controller = new AuthController();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', isAuthenticated, controller.logout);

export default router;
