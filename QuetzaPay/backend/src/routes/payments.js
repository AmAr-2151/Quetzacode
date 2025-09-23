import express from 'express';
import paymentController from '../controllers/paymentController.js';

const router = express.Router();

// Crear nuevo pago (generar QR)
router.post('/', paymentController.createPayment);

// Verificar estado de un pago
router.get('/:transactionId/status', paymentController.checkPaymentStatus);

// Listar transacciones del comerciante
router.get('/merchant/transactions', paymentController.getMerchantTransactions);

export default router;