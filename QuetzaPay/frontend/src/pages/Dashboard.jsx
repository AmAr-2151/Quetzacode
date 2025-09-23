import React, { useState, useEffect } from 'react';
import QRGenerator from '../components/payment/QRGenerator.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { useOffline } from '../hooks/useOffline.js';
import { paymentAPI } from '../services/api.js';

const Dashboard = () => {
  const { merchant } = useAuth();
  const { notifications, isConnected } = useWebSocket(merchant?.id);
  const { isOnline, offlineTransactions, syncOfflineTransactions } = useOffline();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    pendingTransactions: 0
  });

  useEffect(() => {
    loadTransactions();
  }, [merchant]);

  const loadTransactions = async () => {
    try {
      const data = await paymentAPI.getMerchantTransactions(10, 1);
      setRecentTransactions(data.transactions || []);
      
      // Calcular estadísticas simples
      const total = data.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      setStats({
        totalSales: total,
        todaySales: total * 0.3, // Simulación
        pendingTransactions: data.transactions?.filter(t => t.status === 'pending').length || 0
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handlePaymentUpdate = (payment) => {
    setRecentTransactions(prev => [payment, ...prev]);
    loadTransactions(); // Recargar estadísticas
  };

  return (
    <div className="dashboard-container min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">QuetzaPay Dashboard</h1>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className={`px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isConnected ? '✅ Conectado' : '❌ Desconectado'}
          </span>
          <span className={`px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {isOnline ? '🌐 En línea' : '📱 Offline'}
          </span>
          {offlineTransactions.length > 0 && (
            <button
              onClick={syncOfflineTransactions}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
            >
              🔄 Sincronizar ({offlineTransactions.length})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Generación de QR */}
        <div className="lg:col-span-1">
          <QRGenerator onPaymentUpdate={handlePaymentUpdate} />
        </div>

        {/* Estadísticas y Transacciones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjetas de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Ventas Totales</h3>
              <p className="text-2xl font-bold text-green-600">${stats.totalSales} MXN</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Ventas Hoy</h3>
              <p className="text-2xl font-bold text-blue-600">${stats.todaySales} MXN</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Pendientes</h3>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingTransactions}</p>
            </div>
          </div>

          {/* Notificaciones Recientes */}
          {notifications.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3">Pagos Recientes</h3>
              <div className="space-y-2">
                {notifications.map((notif, index) => (
                  <div key={index} className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                    <p className="font-medium">✅ Pago recibido: ${notif.transaction.amount} {notif.transaction.currency}</p>
                    <p className="text-sm text-gray-600">{new Date(notif.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transacciones Recientes */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Transacciones Recientes</h3>
            <div className="space-y-2">
              {recentTransactions.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-medium">${transaction.amount} {transaction.currency}</p>
                    <p className="text-sm text-gray-600">
                      {transaction.status === 'completed' ? '✅ Completado' : '⏳ Pendiente'}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(transaction.createdAt || transaction.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              
              {recentTransactions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay transacciones recientes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;