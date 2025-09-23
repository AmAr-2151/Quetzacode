import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';

function App() {
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [monitoringInterval, setMonitoringInterval] = useState(null);

  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  // ---------- Monitorear estado del pago ----------
  const startPaymentMonitoring = (transactionId) => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/payments/${transactionId}/status`);
        
        if (response.data.success) {
          setPaymentStatus(response.data.interledgerStatus?.state || 'pending');
          
          if (response.data.interledgerStatus?.completed) {
            setPaymentStatus('completed');
            alert('✅ ¡PAGO COMPLETADO! El dinero ha sido transferido exitosamente.');
            setCurrentTransaction(prev => ({ 
              ...prev, 
              status: 'completed',
              completedAt: new Date().toISOString()
            }));
            clearInterval(interval);
            setMonitoringInterval(null);
          }
        }
      } catch (error) {
        console.log('⏳ Esperando pago...', error.message);
      }
    }, 3000);

    setMonitoringInterval(interval);
    return interval;
  };

  // ---------- Crear Pago REAL ----------
  const createPayment = async () => {
    if (!amount || amount <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    setLoading(true);
    setPaymentStatus('pending');
    setCurrentTransaction(null);
    setQrImage('');

    try {
      const response = await axios.post(`/api/payments`, {
        amount: parseFloat(amount),
        currency: 'MXN'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        setCurrentTransaction(response.data);

        const qrData = await QRCode.toDataURL(response.data.paymentUrl, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        setQrImage(qrData);

        startPaymentMonitoring(response.data.transactionId);

        alert(`✅ Pago REAL creado exitosamente!\n\nMonto: $${amount} MXN\nID: ${response.data.transactionId}\n\nEscanea el QR con tu wallet Interledger para realizar el pago real.`);
      }
    } catch (error) {
      console.error('❌ Error creando pago:', error);
      let errorMessage = 'Error desconocido';
      
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.details || error.response.statusText;
      } else if (error.request) {
        errorMessage = 'No se pudo conectar al servidor';
      } else {
        errorMessage = error.message;
      }
      
      alert('❌ Error creando pago: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Detener monitoreo ----------
  const stopMonitoring = () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
      setPaymentStatus('stopped');
      alert('⏹️ Monitoreo detenido');
    }
  };

  // ---------- Render ----------
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '900px', 
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          color: '#2563eb', 
          marginBottom: '10px',
          fontSize: '2.5rem'
        }}>
          🚀 QuetzaPay - Sistema de Pagos Interledger
        </h1>
        <p style={{ 
          color: '#666', 
          fontSize: '1.1rem',
          margin: 0
        }}>
          Pagos digitales reales usando Open Payments API
        </p>
      </div>

      {/* Generador de pagos */}
      <div style={{ 
        border: '2px solid #007bff', 
        padding: '25px', 
        margin: '20px 0', 
        borderRadius: '10px', 
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          color: '#007bff', 
          textAlign: 'center',
          marginBottom: '25px'
        }}>
          💳 Generar Pago Real con Interledger
        </h2>
        
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <label style={{ 
            fontWeight: 'bold', 
            fontSize: '18px', 
            display: 'block', 
            marginBottom: '15px' 
          }}>
            Monto en MXN:
          </label>
          
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="1"
            step="0.01"
            style={{ 
              padding: '12px', 
              border: '2px solid #007bff', 
              borderRadius: '5px', 
              width: '200px', 
              fontSize: '18px', 
              textAlign: 'center',
              fontWeight: 'bold'
            }}
          />
          
          <br />
          
          <button
            onClick={createPayment}
            disabled={loading}
            style={{
              padding: '15px 40px',
              marginTop: '20px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: loading ? '#ffc107' : '#28a745',
              cursor: !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              opacity: !loading ? 1 : 0.7
            }}
          >
            {loading ? '⏳ Creando Pago Real...' : '💰 Crear Pago Real'}
          </button>
        </div>

        {/* Mostrar QR y estado del pago */}
        {currentTransaction && (
          <div style={{ 
            marginTop: '30px', 
            padding: '25px', 
            backgroundColor: '#e8f4fd',
            borderRadius: '10px', 
            textAlign: 'center',
            border: '2px solid #007bff'
          }}>
            <h3 style={{ 
              color: paymentStatus === 'completed' ? '#28a745' : '#007bff',
              marginBottom: '20px'
            }}>
              {paymentStatus === 'completed' ? '✅ ¡PAGO COMPLETADO!' : 
               paymentStatus === 'processing' ? '🔄 Procesando pago...' : 
               '💳 ¡Pago Creado Exitosamente!'}
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* Información de la transacción */}
              <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'left',
                width: '100%',
                maxWidth: '400px'
              }}>
                <p><strong>🔢 ID de Transacción:</strong> {currentTransaction.transactionId}</p>
                <p><strong>💰 Monto:</strong> ${currentTransaction.amount} MXN</p>
                <p><strong>📱 Estado:</strong> 
                  <span style={{
                    color: paymentStatus === 'completed' ? '#28a745' : 
                           paymentStatus === 'processing' ? '#ffc107' : '#007bff',
                    fontWeight: 'bold',
                    marginLeft: '10px'
                  }}>
                    {paymentStatus.toUpperCase()}
                  </span>
                </p>
                <p><strong>⏰ Expira:</strong> {new Date(currentTransaction.expiresAt).toLocaleString()}</p>
              </div>

              {/* Código QR */}
              {qrImage && (
                <div>
                  <h4>📱 Escanea este QR con tu Wallet Interledger</h4>
                  <img 
                    src={qrImage} 
                    alt="Código QR de pago Interledger" 
                    style={{ 
                      marginTop: '15px', 
                      border: '8px solid white', 
                      borderRadius: '15px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      maxWidth: '100%',
                      height: 'auto'
                    }} 
                  />
                </div>
              )}

              {/* URL de pago */}
              <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '500px'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>🔗 URL de pago:</p>
                <p style={{ 
                  wordBreak: 'break-all', 
                  fontSize: '12px', 
                  margin: 0,
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '5px',
                  fontFamily: 'monospace'
                }}>
                  {currentTransaction.paymentUrl}
                </p>
              </div>

              {/* Controles de monitoreo */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '15px'
              }}>
                <button
                  onClick={stopMonitoring}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  ⏹️ Detener Monitoreo
                </button>
                
                <button
                  onClick={() => startPaymentMonitoring(currentTransaction.transactionId)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Reanudar Monitoreo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div style={{
        padding: '20px',
        backgroundColor: '#e9ecef',
        borderRadius: '10px',
        marginTop: '30px',
        fontSize: '14px',
        color: '#495057'
      }}>
        <h3>💡 Instrucciones para probar el pago real:</h3>
        <ol>
          <li>Genera un pago con el monto deseado</li>
          <li>Escanea el QR con la wallet de desarrollo de Interledger</li>
          <li>Completa el pago en la wallet</li>
          <li>El sistema detectará automáticamente el pago completado</li>
        </ol>
        <p><strong>Wallet de prueba:</strong> https://wallet.interledger-test.dev</p>
      </div>
    </div>
  );
}

export default App;
