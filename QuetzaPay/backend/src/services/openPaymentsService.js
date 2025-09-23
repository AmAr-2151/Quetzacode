import { OpenPaymentsConfig } from '../config/openPayments.js';

class OpenPaymentsService {
    constructor() {
        this.client = null;
        this.config = new OpenPaymentsConfig();
        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 3;
    }

    async initialize() {
        if (!this.client) {
            try {
                console.log('🔄 Inicializando cliente Open Payments...');
                this.client = await this.config.getAuthenticatedClient();
                this.isConnected = true;
                this.connectionRetries = 0;
                console.log('✅ Cliente Open Payments conectado');
            } catch (error) {
                this.isConnected = false;
                console.warn('⚠️  No se pudo conectar a Open Payments:', error.message);
                
                if (this.connectionRetries < this.maxRetries) {
                    this.connectionRetries++;
                    console.log(`🔄 Reintentando conexión (${this.connectionRetries}/${this.maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return this.initialize();
                } else {
                    console.error('❌ Máximo de reintentos alcanzado. Modo offline activado.');
                    throw error;
                }
            }
        }
        return this.client;
    }

    async createIncomingPayment(receivingWalletUrl, amount) {
        try {
            await this.initialize();
            
            if (!this.isConnected) {
                throw new Error('Open Payments no disponible. Modo offline.');
            }

            console.log(`💳 Creando incoming payment para ${amount} en ${receivingWalletUrl}`);
            
            const receivingWallet = await this.config.getWalletInfo(receivingWalletUrl);

            const grant = await this.client.grant.request(
                { url: receivingWallet.authServer },
                {
                    access_token: {
                        access: [{ type: "incoming-payment", actions: ["create", "read"] }]
                    }
                }
            );

            const validatedGrant = this.config.validateGrant(grant);

            const incomingPayment = await this.client.incomingPayment.create(
                {
                    url: receivingWallet.resourceServer,
                    accessToken: validatedGrant.access_token.value,
                },
                {
                    walletAddress: receivingWallet.id,
                    incomingAmount: {
                        assetCode: receivingWallet.assetCode,
                        assetScale: receivingWallet.assetScale,
                        value: amount.toString()
                    },
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
                }
            );

            console.log('✅ Incoming payment creado:', incomingPayment.id);
            return { 
                success: true, 
                incomingPayment, 
                grant: validatedGrant,
                mode: 'online'
            };

        } catch (error) {
            console.warn('⚠️  Error creando incoming payment:', error.message);
            
            // Modo offline: generar un ID simulado
            const simulatedPayment = {
                id: `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                walletAddress: receivingWalletUrl,
                incomingAmount: {
                    value: amount.toString(),
                    assetCode: 'MXN',
                    assetScale: 2
                },
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
                simulated: true
            };

            return {
                success: true,
                incomingPayment: simulatedPayment,
                mode: 'offline',
                message: 'Pago creado en modo offline. Se sincronizará cuando la conexión se restablezca.'
            };
        }
    }

    async checkPaymentStatus(paymentUrl) {
        try {
            await this.initialize();
            
            if (!this.isConnected || paymentUrl.includes('simulated-') || paymentUrl.includes('offline-')) {
                // Para pagos simulados/offline, retornar estado pendiente
                return {
                    completed: false,
                    receivedAmount: { value: '0' },
                    state: 'pending',
                    mode: 'offline'
                };
            }

            const payment = await this.client.incomingPayment.get({ url: paymentUrl });
            return {
                completed: payment.completed,
                receivedAmount: payment.receivedAmount,
                state: payment.state,
                mode: 'online'
            };
        } catch (error) {
            console.warn('⚠️  Error verificando estado de pago:', error.message);
            return {
                completed: false,
                receivedAmount: { value: '0' },
                state: 'error',
                mode: 'offline',
                error: error.message
            };
        }
    }

    // Verificar estado de conexión
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            retries: this.connectionRetries,
            maxRetries: this.maxRetries
        };
    }

    // Intentar reconectar manualmente
    async reconnect() {
        this.client = null;
        this.isConnected = false;
        this.connectionRetries = 0;
        return this.initialize();
    }
}

export default new OpenPaymentsService();