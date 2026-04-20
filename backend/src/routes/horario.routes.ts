import { Router } from 'express';
import { HorarioController } from '../controllers/HorarioController';
import { isAuthenticated, isAdmin } from '../middlewares/AuthMiddleware';

const router = Router();
const controller = new HorarioController();

router.get('/', controller.getDisponibles);
router.post('/', isAuthenticated, isAdmin, controller.crear);
router.patch('/:id/toggle', isAuthenticated, isAdmin, controller.toggleDisponibilidad);
router.delete('/:id', isAuthenticated, isAdmin, controller.cancelar);

export default router;
