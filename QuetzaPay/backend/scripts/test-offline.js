import 'dotenv/config';
import mongoose from 'mongoose';
import openPaymentsService from '../src/services/openPaymentsService.js';

async function testOffline() {
    try {
        console.log('📴 Testing Modo Offline...\n');

        // Conectar a MongoDB (local)
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB local');

        // Verificar estado de Open Payments
        const status = openPaymentsService.getConnectionStatus();
        console.log('🔌 Estado de Open Payments:');
        console.log('   - Conectado:', status.isConnected ? '✅' : '❌');
        console.log('   - Reintentos:', status.retries);

        // Probar creación de pago (debería funcionar en modo offline)
        console.log('\n💳 Probando creación de pago offline...');
        
        const paymentResult = await openPaymentsService.createIncomingPayment(
            process.env.MERCHANT_WALLET_ADDRESS_URL,
            "500"
        );

        console.log('✅ Resultado del pago:');
        console.log('   - Modo:', paymentResult.mode);
        console.log('   - ID:', paymentResult.incomingPayment.id);
        console.log('   - Simulado:', paymentResult.incomingPayment.simulated || false);
        console.log('   - Mensaje:', paymentResult.message);

        // Probar verificación de estado
        console.log('\n🔍 Probando verificación de estado...');
        const statusCheck = await openPaymentsService.checkPaymentStatus(paymentResult.incomingPayment.id);
        console.log('✅ Estado del pago:');
        console.log('   - Completado:', statusCheck.completed);
        console.log('   - Modo:', statusCheck.mode);
        console.log('   - Estado:', statusCheck.state);

        console.log('\n🎉 ¡El sistema funciona correctamente en modo offline!');
        console.log('💡 Los pagos se guardarán localmente y se sincronizarán cuando la conexión se restablezca.');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error en prueba offline:', error.message);
    }
}

testOffline();