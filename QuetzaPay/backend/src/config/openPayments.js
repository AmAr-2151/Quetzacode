// Versión más compatible
import dotenv from 'dotenv';
dotenv.config();

// Importación dinámica para manejar mejor CommonJS
let openPaymentsPkg;
try {
    openPaymentsPkg = await import('@interledger/open-payments');
} catch (error) {
    console.error('❌ Error importing open-payments package:', error);
    throw error;
}

const { createAuthenticatedClient, isFinalizedGrant } = openPaymentsPkg.default || openPaymentsPkg;

export class OpenPaymentsConfig {
    constructor() {
        this.privateKey = process.env.OPEN_PAYMENTS_PRIVATE_KEY?.replace(/\\n/g, '\n');
        this.keyId = process.env.OPEN_PAYMENTS_KEY_ID;
        this.walletAddressUrl = process.env.MERCHANT_WALLET_ADDRESS_URL;
        
        this.validateConfig();
    }

    validateConfig() {
        const errors = [];
        
        if (!this.privateKey) {
            errors.push('OPEN_PAYMENTS_PRIVATE_KEY no encontrada');
        }

        if (!this.keyId) {
            errors.push('OPEN_PAYMENTS_KEY_ID no encontrado');
        }

        if (!this.walletAddressUrl) {
            errors.push('MERCHANT_WALLET_ADDRESS_URL no encontrada');
        }

        if (errors.length > 0) {
            console.error('❌ Configuración Open Payments incompleta:', errors);
            throw new Error(`Configuración requerida: ${errors.join(', ')}`);
        }

        console.log('✅ Configuración Open Payments validada');
    }

    async getAuthenticatedClient() {
        try {
            console.log('🔑 Creando cliente autenticado Open Payments...');

            const client = await createAuthenticatedClient({
                walletAddressUrl: this.walletAddressUrl,
                privateKey: this.privateKey,
                keyId: this.keyId
            });
            
            console.log('✅ Cliente autenticado creado');
            return client;
        } catch (error) {
            console.error('❌ Error creando cliente Open Payments:', error);
            throw error;
        }
    }

    async getWalletInfo(walletUrl) {
        try {
            const client = await this.getAuthenticatedClient();
            console.log('🔍 Obteniendo información de wallet:', walletUrl);
            
            const walletInfo = await client.walletAddress.get({ url: walletUrl });
            console.log('✅ Información de wallet obtenida');
            
            return walletInfo;
        } catch (error) {
            console.error('❌ Error obteniendo información de wallet:', error);
            throw error;
        }
    }

    validateGrant(grant) {
        if (!isFinalizedGrant(grant)) {
            throw new Error('Grant no finalizado - autenticación fallida');
        }
        return grant;
    }
}

export const openPaymentsConfig = new OpenPaymentsConfig();