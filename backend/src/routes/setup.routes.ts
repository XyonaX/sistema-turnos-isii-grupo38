import { Router } from 'express';

import { AdminSetupController } from '../controllers/AdminSetupController';

const router = Router();
const controller = new AdminSetupController();

// Esta ruta solo funciona si NO existe un profesional en el sistema
router.post('/', controller.crearAdminInicial);

export default router;
