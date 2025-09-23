import 'dotenv/config';

// Test más simple para verificar solo la conexión
async function testSimple() {
  try {
    console.log('🧪 Test simple de conexión...\n');
    
    // Solo verificar que podemos importar y crear la configuración
    const { OpenPaymentsConfig } = await import('../src/config/openPayments.js');
    
    console.log('1. Creando configuración...');
    const config = new OpenPaymentsConfig();
    console.log('✅ Configuración creada');
    
    console.log('2. Probando conexión con wallet...');
    const walletInfo = await config.getWalletInfo(process.env.MERCHANT_WALLET_ADDRESS_URL);
    console.log('✅ Wallet info obtenida:');
    console.log('   - ID:', walletInfo.id);
    console.log('   - Asset:', walletInfo.assetCode, walletInfo.assetScale);
    
    console.log('\n🎉 ¡Conexión básica funciona!');
    
  } catch (error) {
    console.error('❌ Error en test simple:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
  }
}

testSimple();