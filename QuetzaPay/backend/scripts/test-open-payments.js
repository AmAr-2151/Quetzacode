import 'dotenv/config';
import openPaymentsService from '../src/services/openPaymentsService.js';

async function testOpenPayments() {
  try {
    console.log('🔧 Testing Open Payments Integration...\n');

    // Verificar que las variables de entorno estén cargadas
    console.log('📋 Environment check:');
    console.log('   - Wallet URL:', process.env.MERCHANT_WALLET_ADDRESS_URL);
    console.log('   - Key ID:', process.env.OPEN_PAYMENTS_KEY_ID ? '✅ Present' : '❌ Missing');
    console.log('   - Private Key:', process.env.OPEN_PAYMENTS_PRIVATE_KEY ? '✅ Present' : '❌ Missing');

    // 1. Inicializar el servicio
    console.log('\n1. Initializing Open Payments service...');
    await openPaymentsService.initialize();
    console.log('✅ Service initialized');

    // 2. Crear un incoming payment de prueba
    const testAmount = "1000"; // 10.00 USD
    const merchantWallet = process.env.MERCHANT_WALLET_ADDRESS_URL;
    
    console.log('\n2. Creating incoming payment...');
    const { incomingPayment } = await openPaymentsService.createIncomingPayment(
      merchantWallet, 
      testAmount
    );
    
    console.log('✅ Incoming Payment created:');
    console.log('   - ID:', incomingPayment.id);
    console.log('   - Amount:', incomingPayment.incomingAmount.value);
    console.log('   - Expires:', new Date(incomingPayment.expiresAt).toLocaleString());

    // 3. Crear quote (simulando cliente)
    console.log('\n3. Creating quote...');
    const customerWallet = "https://ilp.interledger-test.dev/143b92ee"; // Wallet de prueba
    
    const quote = await openPaymentsService.createQuote(
      customerWallet,
      incomingPayment.id,
      testAmount
    );
    
    console.log('✅ Quote created:');
    console.log('   - ID:', quote.id);
    console.log('   - Send Amount:', quote.debitAmount.value);
    console.log('   - Receive Amount:', quote.receiveAmount.value);

    // 4. Verificar estado del pago
    console.log('\n4. Checking payment status...');
    const status = await openPaymentsService.checkPaymentStatus(incomingPayment.id);
    console.log('✅ Payment status:');
    console.log('   - Completed:', status.completed);
    console.log('   - State:', status.state);
    console.log('   - Received Amount:', status.receivedAmount?.value || '0');

    console.log('\n🎉 Open Payments integration test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   - Configure frontend QR generation');
    console.log('   - Implement WebSocket notifications');
    console.log('   - Add offline functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testOpenPayments();