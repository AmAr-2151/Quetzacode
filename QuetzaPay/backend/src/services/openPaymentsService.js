import { openPaymentsConfig } from '../config/openPayments.js';

class OpenPaymentsService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionError = null;
    }

    async initialize() {
        if (this.client && this.isConnected) {
            return this.client;
        }

        try {
            console.log('🔄 Inicializando servicio Open Payments...');
            this.client = await openPaymentsConfig.getAuthenticatedClient();
            this.isConnected = true;
            this.connectionError = null;
            console.log('✅ Servicio Open Payments inicializado correctamente');
            return this.client;
        } catch (error) {
            this.isConnected = false;
            this.connectionError = error.message;
            console.error('❌ Error inicializando Open Payments:', error);
            throw error;
        }
    }

    async createIncomingPayment(receivingWalletUrl, amount, currency = 'MXN') {
        await this.initialize();

        console.log(`💳 Creando incoming payment para ${amount} ${currency}`);

        try {
            // Obtener información de la wallet del merchant
            const receivingWallet = await openPaymentsConfig.getWalletInfo(receivingWalletUrl);
            console.log('✅ Wallet info obtenida:', receivingWallet.id);

            if (!receivingWallet.authServer) {
                throw new Error('Wallet no tiene servidor de autenticación configurado');
            }

            // Solicitar grant de autorización
            console.log('🔑 Solicitando grant de autorización...');
            const grant = await this.client.grant.request(
                { url: receivingWallet.authServer },
                {
                    access_token: {
                        access: [
                            { 
                                type: "incoming-payment", 
                                actions: ["create", "read", "list"] 
                            },
                            {
                                type: "quote",
                                actions: ["create"]
                            }
                        ]
                    }
                }
            );

            console.log('✅ Grant recibido:', grant.id);
            const validatedGrant = openPaymentsConfig.validateGrant(grant);

            // CORREGIDO: Remover 'description' y usar parámetros válidos
            console.log('💰 Creando incoming payment...');
            const incomingPayment = await this.client.incomingPayment.create(
                {
                    url: receivingWallet.resourceServer,
                    accessToken: validatedGrant.access_token.value,
                },
                {
                    walletAddress: receivingWallet.id,
                    incomingAmount: {
                        assetCode: currency,
                        assetScale: 2,
                        value: (amount * 100).toString() // Convertir a centavos
                    },
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
                    // REMOVIDO: description no es un parámetro válido
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
            console.error('❌ Error creando incoming payment:', error);
            
            // Log más detallado del error
            if (error.description) {
                console.error('📋 Detalles del error:', error.description);
            }
            if (error.status) {
                console.error('📊 Status code:', error.status);
            }
            
            throw new Error(`Error creando pago: ${error.description || error.message}`);
        }
    }

    async checkPaymentStatus(paymentUrl) {
        await this.initialize();

        try {
            console.log('🔍 Verificando estado del pago:', paymentUrl);
            const payment = await this.client.incomingPayment.get({ url: paymentUrl });
            
            console.log('📊 Estado del pago:', {
                id: payment.id,
                completed: payment.completed,
                receivedAmount: payment.receivedAmount,
                state: payment.state
            });

            return {
                completed: payment.completed || false,
                receivedAmount: payment.receivedAmount || { value: '0' },
                state: payment.state || 'pending',
                mode: 'online',
                paymentDetails: payment
            };
        } catch (error) {
            console.error('❌ Error verificando estado del pago:', error);
            throw error;
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            mode: 'online',
            timestamp: new Date().toISOString(),
            error: this.connectionError
        };
    }

    async reconnect() {
        console.log('🔄 Reconectando servicio Open Payments...');
        this.client = null;
        this.isConnected = false;
        this.connectionError = null;
        
        return await this.initialize();
    }
}

const openPaymentsService = new OpenPaymentsService();
export default openPaymentsService;