import { OpenPaymentsConfig } from '../config/openPayments.js';

class OpenPaymentsService {
  constructor() {
    this.client = null;
    this.config = new OpenPaymentsConfig();
    console.log('🔧 OpenPaymentsService initialized');
  }

  async initialize() {
    if (!this.client) {
      console.log('🔄 Initializing Open Payments client...');
      this.client = await this.config.getAuthenticatedClient();
      console.log('✅ Open Payments client ready');
    }
    return this.client;
  }

  async createIncomingPayment(receivingWalletUrl, amount) {
    await this.initialize();

    console.log(`💳 Creating incoming payment for ${amount}`);
    
    const receivingWallet = await this.config.getWalletInfo(receivingWalletUrl);
    console.log('📋 Wallet info retrieved:', receivingWallet.id);

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

    console.log('✅ Incoming payment created:', incomingPayment.id);
    return { incomingPayment, grant: validatedGrant };
  }

  async createQuote(sendingWalletUrl, incomingPaymentUrl, amount) {
    await this.initialize();

    const sendingWallet = await this.config.getWalletInfo(sendingWalletUrl);

    const grant = await this.client.grant.request(
      { url: sendingWallet.authServer },
      {
        access_token: {
          access: [{ type: "quote", actions: ["create"] }]
        }
      }
    );

    const validatedGrant = this.config.validateGrant(grant);

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

    console.log('✅ Quote created:', quote.id);
    return quote;
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
}

export default new OpenPaymentsService();