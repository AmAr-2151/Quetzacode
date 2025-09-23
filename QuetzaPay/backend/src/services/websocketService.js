// backend/src/services/websocketService.js
export class WebSocketService {
  constructor() {
    this.connections = new Map();
  }

  // Notificar cuando un pago se completa
  notifyPaymentSuccess(merchantId, transaction) {
    const connection = this.connections.get(merchantId);
    if (connection) {
      connection.send(JSON.stringify({
        type: 'PAYMENT_COMPLETED',
        transaction
      }));
    }
  }
}

// frontend/src/hooks/useWebSocket.js
export const useWebSocket = (merchantId) => {
  const [paymentNotifications, setPaymentNotifications] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001?merchantId=${merchantId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'PAYMENT_COMPLETED') {
        setPaymentNotifications(prev => [...prev, data.transaction]);
      }
    };

    return () => ws.close();
  }, [merchantId]);

  return { paymentNotifications };
};