import 'dotenv/config';

async function testCompleteFlow() {
    try {
        console.log('🔄 Testing Flujo Completo de Pagos...\n');

        const OpenPaymentsService = await import('../src/services/openPaymentsService.js').then(m => m.default);

        // 1. Verificar wallets disponibles
        console.log('1. 🔍 Buscando wallets válidas...');
        
        const testWallets = [
            process.env.MERCHANT_WALLET_ADDRESS_URL, // Tu wallet
            "https://ilp.interledger-test.dev/alice",
            "https://ilp.interledger-test.dev/bob"
        ];

        let validClientWallet = null;

        for (const walletUrl of testWallets) {
            const result = await OpenPaymentsService.validateWallet(walletUrl);
            if (result.valid) {
                console.log(`✅ Wallet válida encontrada: ${walletUrl}`);
                if (walletUrl !== process.env.MERCHANT_WALLET_ADDRESS_URL) {
                    validClientWallet = walletUrl;
                    break;
                }
            } else {
                console.log(`❌ Wallet no válida: ${walletUrl} - ${result.error}`);
            }
        }

        if (!validClientWallet) {
            console.log('⚠️  No se encontró una wallet de cliente válida. Usando tu wallet como cliente...');
            validClientWallet = process.env.MERCHANT_WALLET_ADDRESS_URL;
        }

        // 2. Flujo de pago básico (solo incoming payment)
        console.log('\n2. 💳 Creando incoming payment...');
        const incomingResult = await OpenPaymentsService.createIncomingPayment(
            process.env.MERCHANT_WALLET_ADDRESS_URL,
            "500" // 5.00 USD (menor cantidad para pruebas)
        );

        console.log('✅ Incoming payment creado exitosamente!');
        console.log('   - URL:', incomingResult.incomingPayment.id);
        console.log('   - Cantidad:', incomingResult.incomingPayment.incomingAmount.value);

        console.log('\n🎉 ¡Flujo básico funciona! Para quotes necesitas:');
        console.log('   - Una wallet de cliente con fondos reales');
        console.log('   - Configuración adecuada en el auth server');

        console.log('\n📋 Próximos pasos:');
        console.log('   - Configurar el frontend con QR generation');
        console.log('   - Implementar WebSocket para notificaciones');
        console.log('   - Agregar funcionalidad offline');

    } catch (error) {
        console.error('❌ Error en el flujo completo:', error.message);
    }
}

testCompleteFlow();