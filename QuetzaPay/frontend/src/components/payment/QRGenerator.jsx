import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { paymentAPI } from '../../services/api.js';
import { useOffline } from '../../hooks/useOffline.js';

const QRGenerator = ({ onPaymentUpdate }) => {
  const [amount, setAmount] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const { isOnline, addOfflineTransaction } = useOffline();

  const generateQRCode = async (text) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(text, {
        width: 256,
        margin: 2,
        color: {
          dark: '#2563eb',
          light: '#ffffff'
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const createPayment = async () => {
    if (!amount || amount <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    setLoading(true);

    try {
      if (!isOnline) {
        // Modo offline
        const offlineTransaction = {
          amount: parseFloat(amount),
          currency: 'MXN',
          status: 'pending',
          timestamp: new Date().toISOString()
        };

        addOfflineTransaction(offlineTransaction);
        
        setCurrentTransaction(offlineTransaction);
        onPaymentUpdate?.(offlineTransaction);
        
        alert('⚠️ Modo offline: El pago se guardará localmente y se sincronizará cuando recuperes la conexión.');
        setLoading(false);
        return;
      }

      // Modo online - crear pago real
      const paymentResponse = await paymentAPI.createPayment(amount, 'MXN');
      
      if (paymentResponse.success) {
        // Generar QR code
        const qrDataUrl = await generateQRCode(paymentResponse.paymentUrl);
        setQrImage(qrDataUrl);
        setCurrentTransaction(paymentResponse);
        
        onPaymentUpdate?.(paymentResponse);
        
        console.log('✅ QR generado para pago:', paymentResponse.transactionId);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetPayment = () => {
    setQrImage('');
    setCurrentTransaction(null);
    setAmount('');
  };

  return (
    <div className="qr-generator bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Generar QR de Pago</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monto a cobrar (MXN)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ej: 100.00"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <button
        onClick={createPayment}
        disabled={loading || !amount}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Generando QR...' : 'Generar QR de Pago'}
      </button>

      {!isOnline && (
        <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
          ⚠️ Modo offline - Los pagos se guardarán localmente
        </div>
      )}

      {qrImage && currentTransaction && (
        <div className="mt-6 text-center">
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-lg font-semibold text-green-800">
              ${currentTransaction.amount} MXN
            </p>
            <p className="text-sm text-green-600">
              Escanea el código para pagar
            </p>
          </div>
          
          <img 
            src={qrImage} 
            alt="QR Code de pago" 
            className="mx-auto border-4 border-green-200 rounded-lg"
          />
          
          <div className="mt-3 text-xs text-gray-500">
            Transaction ID: {currentTransaction.transactionId}
          </div>
          
          <button
            onClick={resetPayment}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Generar nuevo QR
          </button>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;