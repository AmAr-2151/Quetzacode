import { OpenPaymentsConfig } from '../config/openPayments.js';

class OpenPaymentsService {
    constructor() {
        this.client = null;
        this.config = new OpenPaymentsConfig();
    }

    async initialize() {
        if (!this.client) {
            this.client = await this.config.getAuthenticatedClient();
        }
        return this.client;
    }

    async createIncomingPayment(receivingWalletUrl, amount) {
        await this.initialize();

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
        return { incomingPayment, grant: validatedGrant };
    }

    async createQuote(sendingWalletUrl, incomingPaymentUrl, amount) {
        await this.initialize();

        console.log(`💰 Creando quote desde ${sendingWalletUrl} para ${incomingPaymentUrl}`);

        try {
            const sendingWallet = await this.config.getWalletInfo(sendingWalletUrl);
            console.log('📋 Wallet del cliente obtenida:', sendingWallet.id);

            const grant = await this.client.grant.request(
                { url: sendingWallet.authServer },
                {
                    access_token: {
                        access: [{ type: "quote", actions: ["create"] }]
                    }
                }
            );

            const validatedGrant = this.config.validateGrant(grant);
            console.log('🔑 Grant obtenido para quote');

            const quote = await this.client.quote.create(
                {
                    url: sendingWallet.resourceServer,
                    accessToken: validatedGrant.access_token.value,
                },
                {
                    receiver: incomingPaymentUrl,
                    method: 'ilp',
                    amount: {
                        assetCode: sendingWallet.assetCode,
                        assetScale: sendingWallet.assetScale,
                        value: amount.toString()
                    }
                }
            );

            console.log('✅ Quote creado:', quote.id);
            return quote;

        } catch (error) {
            console.error('❌ Error creando quote:', error.message);
            throw new Error(`Error al crear quote: ${error.message}`);
        }
    }

    async checkPaymentStatus(paymentUrl) {
        await this.initialize();
        
        try {
            const payment = await this.client.incomingPayment.get({ url: paymentUrl });
            return {
                completed: payment.completed,
                receivedAmount: payment.receivedAmount,
                state: payment.state
            };
        } catch (error) {
            throw new Error(`Error checking payment status: ${error.message}`);
        }
    }

    // Nuevo método: Verificar si una wallet es válida
    async validateWallet(walletUrl) {
        try {
            await this.initialize();
            const wallet = await this.config.getWalletInfo(walletUrl);
            return {
                valid: true,
                wallet: {
                    id: wallet.id,
                    assetCode: wallet.assetCode,
                    authServer: wallet.authServer,
                    resourceServer: wallet.resourceServer
                }
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
}

export default new OpenPaymentsService();