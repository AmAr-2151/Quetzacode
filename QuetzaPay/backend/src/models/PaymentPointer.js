import mongoose from 'mongoose';

const paymentPointerSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  publicName: {
    type: String,
    required: true
  },
  assetCode: {
    type: String,
    default: 'USD'
  },
  assetScale: {
    type: Number,
    default: 9
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

export const PaymentPointer = mongoose.model('PaymentPointer', paymentPointerSchema);