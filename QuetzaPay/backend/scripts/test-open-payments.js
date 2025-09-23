import 'dotenv/config';

async function testOpenPayments() {
    try {
        console.log('🔧 Testing Open Payments Integration...\n');

        const { OpenPaymentsConfig } = await import('../src/config/openPayments.js');
        const OpenPaymentsService = await import('../src/services/openPaymentsService.js').then(m => m.default);
        
        const config = new OpenPaymentsConfig();
        console.log('✅ Configuración cargada');

        // 1. Verificar la wallet del merchant
        console.log('\n1. Verificando wallet del merchant...');
        const merchantWallet = await config.getWalletInfo(process.env.MERCHANT_WALLET_ADDRESS_URL);
        console.log('✅ Merchant wallet activa:', merchantWallet.id);

        // 2. Crear incoming payment
        console.log('\n2. Creando incoming payment...');
        const incomingResult = await OpenPaymentsService.createIncomingPayment(
            process.env.MERCHANT_WALLET_ADDRESS_URL,
            "1000" // 10.00 USD
        );
        
        console.log('✅ Incoming payment creado:');
        console.log('   - ID:', incomingResult.incomingPayment.id);
        console.log('   - Amount:', incomingResult.incomingPayment.incomingAmount.value);

        // 3. Verificar que el incoming payment se puede consultar
        console.log('\n3. Verificando estado del incoming payment...');
        const status = await OpenPaymentsService.checkPaymentStatus(incomingResult.incomingPayment.id);
        console.log('✅ Estado del pago:');
        console.log('   - Completed:', status.completed);
        console.log('   - State:', status.state);
        console.log('   - Received Amount:', status.receivedAmount?.value || '0');

        console.log('\n🎉 ¡Prueba básica completada! El flujo de incoming payment funciona.');
        console.log('\n💡 Para probar quotes necesitas:');
        console.log('   - Una wallet de cliente válida y configurada');
        console.log('   - Fondos suficientes en la wallet del cliente');
        console.log('   - Permisos adecuados en el auth server');

        // Mostrar información para pruebas manuales
        console.log('\n📋 Información para pruebas manuales:');
        console.log('   - Incoming Payment URL:', incomingResult.incomingPayment.id);
        console.log('   - Merchant Wallet:', process.env.MERCHANT_WALLET_ADDRESS_URL);
        console.log('   - Expira:', new Date(incomingResult.incomingPayment.expiresAt).toLocaleString());

    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        
        if (error.message.includes('POST request')) {
            console.log('\n💡 El error es al hacer una solicitud POST al servidor de Open Payments.');
            console.log('   Posibles causas:');
            console.log('   - Wallet no existe o no está configurada');
            console.log('   - Problemas de red o CORS');
            console.log('   - El servidor de Open Payments está caído');
            console.log('   - Permisos insuficientes en la wallet');
        }
    }
}

testOpenPayments();