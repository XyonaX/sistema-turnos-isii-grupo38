import { Router } from 'express';
import { TurnoController } from '../controllers/TurnoController';
import { isAuthenticated, isAdmin } from '../middlewares/AuthMiddleware';

const router = Router();
const controller = new TurnoController();

router.post('/', isAuthenticated, controller.reservar);
router.get('/mis-turnos', isAuthenticated, controller.getMisTurnos);
router.patch('/:id/cancelar', isAuthenticated, controller.cancelarMio);
router.get('/admin', isAuthenticated, isAdmin, controller.getTodos);
router.patch('/admin/:id/cancelar', isAuthenticated, isAdmin, controller.cancelarAdmin);

export default router;
