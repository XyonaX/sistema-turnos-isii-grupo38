import { Router } from 'express';
import { AdminSetupController } from '../controllers/AdminSetupController';

const router = Router();
const controller = new AdminSetupController();

// Esta ruta solo funciona si NO existe admin en el sistema
router.post('/setup', controller.crearAdminInicial);

export default router;
