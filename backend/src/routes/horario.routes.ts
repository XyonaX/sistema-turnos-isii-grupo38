import { Router } from 'express';

import { HorarioController } from '../controllers/HorarioController';
import { isAuthenticated, isProfesional } from '../middlewares/AuthMiddleware';

const router = Router();
const controller = new HorarioController();

router.get('/', controller.getDisponibles);
router.get('/profesional', isAuthenticated, isProfesional, controller.getMisFranjas);
router.post('/', isAuthenticated, isProfesional, controller.crear);
router.patch('/:id/toggle', isAuthenticated, isProfesional, controller.toggleDisponibilidad);
router.delete('/:id', isAuthenticated, isProfesional, controller.cancelar);

export default router;
