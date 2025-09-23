import { WebSocketServer } from 'ws';
import openPaymentsService from './openPaymentsService.js';
import { Transaction } from '../models/Transaction.js';

export class WebSocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map(); // merchantId -> WebSocket connection
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws, request) => {
      console.log('🔌 Nueva conexión WebSocket');
      
      const url = new URL(request.url, `http://${request.headers.host}`);
      const merchantId = url.searchParams.get('merchantId');
      
      if (merchantId) {
        this.connections.set(merchantId, ws);
        console.log(`✅ Merchant ${merchantId} conectado via WebSocket`);
      }

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(merchantId, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        if (merchantId) {
          this.connections.delete(merchantId);
          console.log(`❌ Merchant ${merchantId} desconectado`);
        }
      });

      // Enviar mensaje de bienvenida
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        message: 'WebSocket connection established',
        merchantId
      }));
    });

    console.log('✅ WebSocket server initialized');
  }

  // Notificar a un merchant específico
  notifyMerchant(merchantId, message) {
    const ws = this.connections.get(merchantId);
    if (ws && ws.readyState === 1) { // 1 = OPEN
      ws.send(JSON.stringify(message));
    }
  }

  // Notificar pago completado
  async notifyPaymentCompleted(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId).populate('merchantId');
      if (transaction && transaction.merchantId) {
        this.notifyMerchant(transaction.merchantId._id.toString(), {
          type: 'PAYMENT_COMPLETED',
          transaction: {
            id: transaction._id,
            amount: transaction.amount,
            currency: transaction.currency,
            completedAt: transaction.completedAt
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error notifying payment completion:', error);
    }
  }

  handleMessage(merchantId, data) {
    console.log(`📨 Mensaje de ${merchantId}:`, data);
    
    switch (data.type) {
      case 'PING':
        this.notifyMerchant(merchantId, { type: 'PONG', timestamp: new Date().toISOString() });
        break;
      default:
        console.log('Tipo de mensaje no reconocido:', data.type);
    }
  }
}

export default new WebSocketService();