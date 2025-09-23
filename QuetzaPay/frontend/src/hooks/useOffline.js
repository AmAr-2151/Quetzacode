import { useState, useEffect } from 'react';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineTransactions, setOfflineTransactions] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Conexión restaurada');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('⚠️  Sin conexión a internet');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cargar transacciones offline guardadas
    const savedTransactions = localStorage.getItem('quetza_offline_transactions');
    if (savedTransactions) {
      setOfflineTransactions(JSON.parse(savedTransactions));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addOfflineTransaction = (transaction) => {
    const newTransactions = [...offlineTransactions, {
      ...transaction,
      id: `offline-${Date.now()}`,
      timestamp: new Date().toISOString(),
      synced: false
    }];

    setOfflineTransactions(newTransactions);
    localStorage.setItem('quetza_offline_transactions', JSON.stringify(newTransactions));
  };

  const syncOfflineTransactions = async () => {
    if (offlineTransactions.length === 0) return;

    console.log('🔄 Sincronizando transacciones offline...');
    
    // Aquí iría la lógica para sincronizar con el backend
    // Por ahora, simulamos la sincronización
    setTimeout(() => {
      setOfflineTransactions([]);
      localStorage.removeItem('quetza_offline_transactions');
      console.log('✅ Transacciones offline sincronizadas');
    }, 2000);
  };

  return {
    isOnline,
    offlineTransactions,
    addOfflineTransaction,
    syncOfflineTransactions
  };
};