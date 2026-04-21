import { Router } from 'express';

import { ServicioController } from '../controllers/ServicioController';
import { isAuthenticated, isProfesional } from '../middlewares/AuthMiddleware';

const router = Router();
const controller = new ServicioController();

// GET /servicios/todos - listar todos los servicios (público)
router.get('/todos', controller.listarTodos);

// POST /servicios - crear servicio (requiere autenticado y profesional)
router.post('/', isAuthenticated, isProfesional, controller.crear);

// GET /servicios - listar servicios del profesional actual
router.get('/', isAuthenticated, isProfesional, controller.listar);

// GET /servicios/:id - obtener servicio (público)
router.get('/:id', controller.obtener);

// PATCH /servicios/:id - actualizar servicio (solo propietario)
router.patch('/:id', isAuthenticated, isProfesional, controller.actualizar);

// DELETE /servicios/:id - eliminar servicio (solo propietario)
router.delete('/:id', isAuthenticated, isProfesional, controller.eliminar);

export default router;
