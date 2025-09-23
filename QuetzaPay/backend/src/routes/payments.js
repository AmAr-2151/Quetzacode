import express from 'express';
import paymentController from '../controllers/paymentController.js';

const router = express.Router();

// Estado del servicio
router.get('/status', paymentController.getServiceStatus);
router.post('/reconnect', paymentController.reconnectService);

// Crear nuevo pago (generar QR)
router.post('/', paymentController.createPayment);

// Verificar estado de un pago
router.get('/:transactionId/status', paymentController.checkPaymentStatus);

export default router;