import openPaymentsService from '../services/openPaymentsService.js';
import { Transaction } from '../models/Transaction.js';
import { Merchant } from '../models/Merchant.js';
import websocketService from '../services/websocketService.js';

const paymentController = {
  async createPayment(req, res) {
    try {
      const { amount, currency = 'MXN' } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount is required and must be greater than 0' });
      }

      console.log(`💳 Creando pago REAL de ${amount} ${currency}`);

      // Buscar merchant por email o walletAddress
      let merchant = await Merchant.findOne({
        $or: [
          { email: 'merchant@quetza.com' },
          { walletAddress: process.env.MERCHANT_WALLET_ADDRESS_URL }
        ]
      });

      // Si no existe, crear nuevo merchant
      if (!merchant) {
        merchant = await Merchant.create({
          name: 'Merchant de Prueba',
          email: 'merchant@quetza.com',
          walletAddress: process.env.MERCHANT_WALLET_ADDRESS_URL,
          businessName: 'QuetzaPay Merchant'
        });
      }

      // Crear incoming payment REAL
      const paymentResult = await openPaymentsService.createIncomingPayment(
        merchant.walletAddress,
        amount,
        currency
      );

      // Guardar transacción en la base de datos
      const transaction = await Transaction.create({
        merchantId: merchant._id,
        amount: parseFloat(amount),
        currency,
        status: 'pending',
        paymentUrl: paymentResult.incomingPayment.id,
        expiresAt: new Date(paymentResult.incomingPayment.expiresAt),
        isOffline: false,
        synced: true,
        metadata: {
          mode: 'online',
          incomingPaymentId: paymentResult.incomingPayment.id,
          assetCode: paymentResult.incomingPayment.incomingAmount?.assetCode || currency,
          assetScale: paymentResult.incomingPayment.incomingAmount?.assetScale || 2,
          description: paymentResult.incomingPayment.description
        }
      });

      console.log('✅ Transacción guardada:', transaction._id);

      res.status(201).json({
        success: true,
        transactionId: transaction._id,
        paymentUrl: paymentResult.incomingPayment.id,
        qrData: paymentResult.incomingPayment.id,
        amount: parseFloat(amount),
        currency,
        expiresAt: transaction.expiresAt,
        mode: 'online',
        message: 'Payment QR generated successfully - READY FOR REAL PAYMENT',
        connectionStatus: openPaymentsService.getConnectionStatus(),
        instructions: 'Scan this QR with Interledger Wallet to make real payment'
      });

    } catch (error) {
      console.error('❌ Error creando pago real:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create real payment',
        details: error.message,
        connectionStatus: openPaymentsService.getConnectionStatus()
      });
    }
  },

  async checkPaymentStatus(req, res) {
    try {
      const { transactionId } = req.params;
      const transaction = await Transaction.findById(transactionId);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const paymentStatus = await openPaymentsService.checkPaymentStatus(transaction.paymentUrl);

      if (paymentStatus.completed && transaction.status !== 'completed') {
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        transaction.synced = true;
        await transaction.save();

        await websocketService.notifyPaymentCompleted(transaction._id);
        console.log(`✅ Pago completado: ${transaction._id}`);
      }

      res.json({
        success: true,
        transactionId: transaction._id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        interledgerStatus: paymentStatus,
        completedAt: transaction.completedAt,
        mode: 'online',
        connectionStatus: openPaymentsService.getConnectionStatus(),
        isPaid: paymentStatus.completed
      });

    } catch (error) {
      console.error('❌ Error verificando estado real:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check real payment status',
        details: error.message
      });
    }
  },

  async getServiceStatus(req, res) {
    try {
      const status = openPaymentsService.getConnectionStatus();
      let walletInfo = null;

      try {
        const { openPaymentsConfig } = await import('../config/openPayments.js');
        walletInfo = await openPaymentsConfig.getWalletInfo(process.env.MERCHANT_WALLET_ADDRESS_URL);
      } catch (error) {
        console.warn('⚠️ No se pudo obtener info de wallet:', error.message);
      }

      res.json({
        success: true,
        service: 'QuetzaPay Backend - REAL MODE',
        timestamp: new Date().toISOString(),
        openPayments: status,
        walletInfo: walletInfo ? {
          id: walletInfo.id,
          assetCode: walletInfo.assetCode,
          assetScale: walletInfo.assetScale
        } : null,
        database: 'connected',
        environment: process.env.NODE_ENV,
        mode: 'REAL_PAYMENTS'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Service status check failed'
      });
    }
  },

  async reconnectService(req, res) {
    try {
      const status = openPaymentsService.reconnect
        ? await openPaymentsService.reconnect()
        : openPaymentsService.getConnectionStatus();

      res.json({
        success: true,
        message: 'Service reconnected successfully',
        connectionStatus: status
      });
    } catch (error) {
      console.error('❌ Error reconectando servicio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reconnect service',
        details: error.message
      });
    }
  }
};

// Asegúrate de que se exporte correctamente
export default paymentController;