import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (merchantId) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    if (!merchantId) return;

    const connectWebSocket = () => {
      const wsUrl = `ws://localhost:3001?merchantId=${merchantId}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket conectado');
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Mensaje WebSocket:', data);

          if (data.type === 'PAYMENT_COMPLETED') {
            setNotifications(prev => [data, ...prev.slice(0, 9)]);
            
            // Emitir evento personalizado para actualizar UI
            window.dispatchEvent(new CustomEvent('paymentCompleted', {
              detail: data.transaction
            }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('❌ WebSocket desconectado');
        setIsConnected(false);
        
        // Reconectar después de 5 segundos
        setTimeout(connectWebSocket, 5000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [merchantId]);

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    isConnected,
    sendMessage,
    clearNotifications
  };
};