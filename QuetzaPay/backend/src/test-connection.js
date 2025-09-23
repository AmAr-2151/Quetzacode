import { openPaymentsConfig } from './config/openPayments.js';

async function testConnection() {
    try {
        console.log('🧪 Probando conexión Open Payments...');
        
        const client = await openPaymentsConfig.getAuthenticatedClient();
        console.log('✅ Cliente creado exitosamente');
        
        const walletInfo = await openPaymentsConfig.getWalletInfo(process.env.MERCHANT_WALLET_ADDRESS_URL);
        console.log('✅ Wallet info obtenida:', walletInfo);
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
    }
}

testConnection();