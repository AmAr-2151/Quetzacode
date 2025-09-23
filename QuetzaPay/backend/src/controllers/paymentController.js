import openPaymentsService from '../services/openPaymentsService.js';
import { Transaction } from '../models/Transaction.js';
import { Merchant } from '../models/Merchant.js';

export const paymentController = {
  /**
   * Crear un nuevo pago (QR) para un comerciante
   */
  async createPayment(req, res) {
    try {
      const { amount, currency = 'MXN' } = req.body;
      const merchantId = req.user?.id || 'test-merchant'; // En producción viene del auth middleware

      // Validaciones básicas
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount is required and must be greater than 0' });
      }

      console.log(`💳 Creando pago de ${amount} ${currency} para merchant: ${merchantId}`);

      // Obtener información del comerciante
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return res.status(404).json({ error: 'Merchant not found' });
      }

      // Crear incoming payment en Interledger
      const incomingPaymentResult = await openPaymentsService.createIncomingPayment(
        merchant.walletAddress,
        amount
      );

      // Guardar transacción en la base de datos
      const transaction = await Transaction.create({
        merchantId: merchant._id,
        amount: parseInt(amount),
        currency,
        status: 'pending',
        paymentUrl: incomingPaymentResult.incomingPayment.id,
        expiresAt: new Date(incomingPaymentResult.incomingPayment.expiresAt),
        metadata: {
          incomingPaymentId: incomingPaymentResult.incomingPayment.id,
          assetCode: incomingPaymentResult.incomingPayment.incomingAmount.assetCode,
          assetScale: incomingPaymentResult.incomingPayment.incomingAmount.assetScale
        }
      });

      // Respuesta exitosa
      res.status(201).json({
        success: true,
        transactionId: transaction._id,
        paymentUrl: incomingPaymentResult.incomingPayment.id,
        qrData: incomingPaymentResult.incomingPayment.id, // URL para el QR
        amount: parseInt(amount),
        currency,
        expiresAt: transaction.expiresAt,
        message: 'Payment QR generated successfully'
      });

    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ 
        error: 'Failed to create payment',
        details: error.message 
      });
    }
  },

  /**
   * Verificar estado de un pago
   */
  async checkPaymentStatus(req, res) {
    try {
      const { transactionId } = req.params;

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Verificar estado en Interledger
      const paymentStatus = await openPaymentsService.checkPaymentStatus(transaction.paymentUrl);

      // Actualizar estado en la base de datos si cambió
      if (paymentStatus.completed && transaction.status !== 'completed') {
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        await transaction.save();
      }

      res.json({
        transactionId: transaction._id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        interledgerStatus: paymentStatus,
        completedAt: transaction.completedAt
      });

    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(500).json({ error: 'Failed to check payment status' });
    }
  },

  /**
   * Listar transacciones de un comerciante
   */
  async getMerchantTransactions(req, res) {
    try {
      const merchantId = req.user?.id || 'test-merchant';
      const { limit = 50, page = 1 } = req.query;

      const transactions = await Transaction.find({ merchantId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Transaction.countDocuments({ merchantId });

      res.json({
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
};

export default paymentController;