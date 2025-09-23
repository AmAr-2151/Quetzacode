// frontend/src/components/payment/QRGenerator.jsx
import React, { useState, useEffect } from 'react';
import { useMerchant } from '../../hooks/useMerchant';
import { generateQRCode } from '../../utils/helpers';

const QRGenerator = ({ amount, onPaymentCreated }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { merchant } = useMerchant();

  const createPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      const data = await response.json();
      if (data.success) {
        setQrData(data.paymentUrl);
        onPaymentCreated(data.transactionId);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qr-generator">
      <button onClick={createPayment} disabled={loading}>
        {loading ? 'Generando QR...' : `Generar QR de pago - $${amount}`}
      </button>
      
      {qrData && (
        <div className="qr-container">
          <img src={generateQRCode(qrData)} alt="QR Code de pago" />
          <p>Escanea este código para pagar</p>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;