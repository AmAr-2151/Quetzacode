import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      throw new Error('No hay conexión a internet. Los pagos se guardarán localmente.');
    }
    
    throw error;
  }
);

export const paymentAPI = {
  // Crear nuevo pago
  async createPayment(amount, currency = 'MXN') {
    const response = await api.post('/payments', { amount, currency });
    return response.data;
  },

  // Verificar estado de pago
  async checkPaymentStatus(transactionId) {
    const response = await api.get(`/payments/${transactionId}/status`);
    return response.data;
  },

  // Obtener transacciones del merchant
  async getMerchantTransactions(limit = 50, page = 1) {
    const response = await api.get(`/payments/merchant/transactions?limit=${limit}&page=${page}`);
    return response.data;
  }
};

export default api;