// backend/src/controllers/paymentController.js
import { OpenPaymentsService } from '../services/openPaymentsService.js';

export const createPayment = async (req, res) => {
  try {
    const { amount, customerWallet } = req.body;
    const merchantId = req.user.id; // Del middleware de autenticación
    
    const merchant = await Merchant.findById(merchantId);
    const openPayments = new OpenPaymentsService();
    
    const paymentIntent = await openPayments.createPaymentIntent(
      amount, 
      merchant.walletAddress, 
      customerWallet
    );

    // Guardar en base de datos
    const transaction = await Transaction.create({
      merchantId,
      amount,
      paymentUrl: paymentIntent.paymentUrl,
      status: 'pending',
      quoteId: paymentIntent.quoteId
    });

    res.json({
      success: true,
      paymentUrl: paymentIntent.paymentUrl,
      transactionId: transaction._id,
      expiresAt: paymentIntent.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};