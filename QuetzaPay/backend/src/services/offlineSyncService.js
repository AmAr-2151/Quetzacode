import { Transaction } from '../models/Transaction.js';
import openPaymentsService from './openPaymentsService.js';

export class OfflineSyncService {
  constructor() {
    this.isSyncing = false;
  }

  /**
   * Sincronizar transacciones offline pendientes
   */
  async syncOfflineTransactions(merchantId) {
    if (this.isSyncing) {
      console.log('⚠️  Sync already in progress');
      return;
    }

    this.isSyncing = true;
    try {
      console.log(`🔄 Sincronizando transacciones offline para merchant: ${merchantId}`);
      
      const pendingTransactions = await Transaction.find({
        merchantId,
        isOffline: true,
        synced: false,
        status: 'pending'
      });

      console.log(`📊 ${pendingTransactions.length} transacciones pendientes de sincronización`);

      for (const transaction of pendingTransactions) {
        try {
          // Verificar estado en Interledger
          const status = await openPaymentsService.checkPaymentStatus(transaction.paymentUrl);
          
          if (status.completed) {
            transaction.status = 'completed';
            transaction.synced = true;
            transaction.completedAt = new Date();
            await transaction.save();
            
            console.log(`✅ Transacción ${transaction._id} sincronizada y completada`);
          }
        } catch (error) {
          console.error(`❌ Error sincronizando transacción ${transaction._id}:`, error.message);
        }
      }

      console.log('✅ Sincronización completada');

    } catch (error) {
      console.error('❌ Error en sincronización:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Crear transacción en modo offline
   */
  async createOfflineTransaction(merchantId, amount, currency) {
    try {
      // Generar un ID temporal para la transacción offline
      const tempPaymentUrl = `offline-${merchantId}-${Date.now()}`;
      
      const transaction = await Transaction.create({
        merchantId,
        amount,
        currency,
        status: 'pending',
        paymentUrl: tempPaymentUrl,
        isOffline: true,
        synced: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas para sincronizar
        metadata: {
          offline: true,
          createdAt: new Date().toISOString()
        }
      });

      console.log(`📱 Transacción offline creada: ${transaction._id}`);
      return transaction;

    } catch (error) {
      console.error('Error creating offline transaction:', error);
      throw error;
    }
  }
}

export default new OfflineSyncService();