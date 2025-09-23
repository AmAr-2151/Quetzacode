import 'dotenv/config';

async function testWallets() {
    try {
        console.log('🔍 Probando wallets de Interledger...\n');

        const { OpenPaymentsConfig } = await import('../src/config/openPayments.js');
        const config = new OpenPaymentsConfig();

        // Wallets de prueba conocidas
        const testWallets = [
            process.env.MERCHANT_WALLET_ADDRESS_URL, // Tu wallet principal
            "https://ilp.interledger-test.dev/alice", // Wallet de prueba común
            "https://ilp.interledger-test.dev/bob",   // Otra wallet de prueba
            "https://ilp.interledger-test.dev/143b92ee" // La que causó error
        ];

        for (const walletUrl of testWallets) {
            console.log(`\n🧪 Probando wallet: ${walletUrl}`);
            try {
                const walletInfo = await config.getWalletInfo(walletUrl);
                console.log('✅ Wallet activa:');
                console.log('   - ID:', walletInfo.id);
                console.log('   - Asset:', walletInfo.assetCode);
                console.log('   - Auth Server:', walletInfo.authServer);
                console.log('   - Resource Server:', walletInfo.resourceServer);
            } catch (error) {
                console.log('❌ Wallet no accesible:', error.message);
            }
        }

    } catch (error) {
        console.error('Error general:', error.message);
    }
}

testWallets();