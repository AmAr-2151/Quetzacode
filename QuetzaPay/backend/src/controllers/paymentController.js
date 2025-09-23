import openPaymentsService from '../services/openPaymentsService.js';
import { Transaction } from '../models/Transaction.js';
import { Merchant } from '../models/Merchant.js';

export const paymentController = {
    async createPayment(req, res) {
        try {
            const { amount, currency = 'MXN' } = req.body;
            const merchantId = req.user?.id || 'test-merchant';

            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Amount is required and must be greater than 0' });
            }

            console.log(`💳 Creando pago de ${amount} ${currency} para merchant: ${merchantId}`);

            // Obtener información del comerciante
            const merchant = await Merchant.findOne({ email: 'test@quetza.com' }) || 
                           await Merchant.create({
                               name: 'Tienda de Prueba',
                               email: 'test@quetza.com',
                               walletAddress: process.env.MERCHANT_WALLET_ADDRESS_URL,
                               businessName: 'QuetzaPay Test Store'
                           });

            // Crear incoming payment (online u offline)
            const paymentResult = await openPaymentsService.createIncomingPayment(
                merchant.walletAddress,
                amount
            );

            // Determinar estado basado en el modo
            const status = paymentResult.mode === 'online' ? 'pending' : 'offline-pending';

            // Guardar transacción en la base de datos
            const transaction = await Transaction.create({
                merchantId: merchant._id,
                amount: parseInt(amount),
                currency,
                status: status,
                paymentUrl: paymentResult.incomingPayment.id,
                expiresAt: new Date(paymentResult.incomingPayment.expiresAt),
                isOffline: paymentResult.mode === 'offline',
                synced: paymentResult.mode === 'online',
                metadata: {
                    mode: paymentResult.mode,
                    incomingPaymentId: paymentResult.incomingPayment.id,
                    assetCode: paymentResult.incomingPayment.incomingAmount?.assetCode || 'MXN',
                    assetScale: paymentResult.incomingPayment.incomingAmount?.assetScale || 2,
                    simulated: paymentResult.incomingPayment.simulated || false
                }
            });

            // Respuesta exitosa
            res.status(201).json({
                success: true,
                transactionId: transaction._id,
                paymentUrl: paymentResult.incomingPayment.id,
                qrData: paymentResult.incomingPayment.id,
                amount: parseInt(amount),
                currency,
                expiresAt: transaction.expiresAt,
                mode: paymentResult.mode,
                message: paymentResult.message || 'Payment QR generated successfully',
                connectionStatus: openPaymentsService.getConnectionStatus()
            });

        } catch (error) {
            console.error('Error creating payment:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to create payment',
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

            // Verificar estado en Interledger (o simulado)
            const paymentStatus = await openPaymentsService.checkPaymentStatus(transaction.paymentUrl);

            // Actualizar estado en la base de datos si cambió
            if (paymentStatus.completed && transaction.status !== 'completed') {
                transaction.status = 'completed';
                transaction.completedAt = new Date();
                transaction.synced = true;
                await transaction.save();
            }

            res.json({
                success: true,
                transactionId: transaction._id,
                status: transaction.status,
                amount: transaction.amount,
                currency: transaction.currency,
                interledgerStatus: paymentStatus,
                completedAt: transaction.completedAt,
                mode: paymentStatus.mode,
                connectionStatus: openPaymentsService.getConnectionStatus()
            });

        } catch (error) {
            console.error('Error checking payment status:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to check payment status',
                details: error.message 
            });
        }
    },

    // Nuevo endpoint: Estado del servicio
    async getServiceStatus(req, res) {
        try {
            const status = openPaymentsService.getConnectionStatus();
            
            res.json({
                success: true,
                service: 'QuetzaPay Backend',
                timestamp: new Date().toISOString(),
                openPayments: status,
                database: 'connected', // Asumiendo que MongoDB está conectado
                environment: process.env.NODE_ENV
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Service status check failed'
            });
        }
    },

    // Reconectar manualmente
    async reconnectService(req, res) {
        try {
            await openPaymentsService.reconnect();
            const status = openPaymentsService.getConnectionStatus();
            
            res.json({
                success: true,
                message: 'Reconnection attempt completed',
                status: status
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Reconnection failed',
                details: error.message
            });
        }
    }
};

export default paymentController;