import { Router } from 'express';

import { AdminSetupController } from '../controllers/AdminSetupController';

const router = Router();
const controller = new AdminSetupController();

// Crear roles iniciales
router.post('/roles', controller.crearRolesIniciales);

// Esta ruta solo funciona si NO existe un profesional en el sistema
router.post('/', controller.crearAdminInicial);

export default router;
