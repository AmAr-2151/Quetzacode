import axios from 'axios';

const OPEN_PAYMENTS_BASE = 'https://wallet.interledger-test.dev';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

class OpenPaymentsService {
  constructor() {
    this.client = axios.create({
      baseURL: OPEN_PAYMENTS_BASE,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Crear un payment pointer para el comercio
  async createPaymentPointer(merchantInfo) {
    try {
      const response = await this.client.post('/payment-pointers', {
        identifier: merchantInfo.id,
        name: merchantInfo.businessName
      });
      return response.data;
    } catch (error) {
      console.error('Error creando payment pointer:', error);
      throw error;
    }
  }

  // Generar invoice para pago
  async createInvoice(amount, description, merchantId) {
    try {
      const response = await this.client.post('/invoices', {
        amount: amount,
        description: description,
        merchantId: merchantId,
        callbackUrl: `${BACKEND_URL}/api/payments/callback`
      });
      return response.data;
    } catch (error) {
      console.error('Error creando invoice:', error);
      throw error;
    }
  }

  // Verificar estado de pago
  async checkPaymentStatus(invoiceId) {
    try {
      const response = await this.client.get(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error verificando pago:', error);
      throw error;
    }
  }
}

export default new OpenPaymentsService();