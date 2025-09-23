import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'expired'],
    default: 'pending'
  },
  paymentUrl: {
    type: String,
    required: true
  },
  quoteId: {
    type: String
  },
  outgoingPaymentId: {
    type: String
  },
  customerWallet: {
    type: String
  },
  // Para funcionalidad offline
  isOffline: {
    type: Boolean,
    default: false
  },
  synced: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
transactionSchema.index({ merchantId: 1, status: 1 });
transactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL para transacciones expiradas
transactionSchema.index({ paymentUrl: 1 }, { unique: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);