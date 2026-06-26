import { Router } from 'express';

import { PagoController } from '../controllers/PagoController';
import { isAuthenticated } from '../middlewares/AuthMiddleware';

const router = Router();
const controller = new PagoController();

router.post('/procesar', isAuthenticated, controller.procesar);
router.post('/cancelar', isAuthenticated, controller.cancelar);

export default router;
