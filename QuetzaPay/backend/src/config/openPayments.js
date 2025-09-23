import { createAuthenticatedClient, isFinalizedGrant } from '@interledger/open-payments';

export class OpenPaymentsConfig {
  constructor() {
    // Asegurar que los saltos de línea sean correctos
    this.privateKey = process.env.OPEN_PAYMENTS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    this.keyId = process.env.OPEN_PAYMENTS_KEY_ID;
    this.walletAddressUrl = process.env.MERCHANT_WALLET_ADDRESS_URL;
    
    this.validateConfig();
  }

  validateConfig() {
    if (!this.privateKey) {
      throw new Error('OPEN_PAYMENTS_PRIVATE_KEY is required');
    }
    if (!this.keyId) {
      throw new Error('OPEN_PAYMENTS_KEY_ID is required');
    }
    if (!this.walletAddressUrl) {
      throw new Error('MERCHANT_WALLET_ADDRESS_URL is required');
    }

    // Validar formato básico de la clave privada
    if (!this.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('La clave privada no tiene el formato PEM correcto');
    }
  }

  async getAuthenticatedClient() {
    try {
      return await createAuthenticatedClient({
        walletAddressUrl: this.walletAddressUrl,
        privateKey: this.privateKey,
        keyId: this.keyId
      });
    } catch (error) {
      console.error('Error creando cliente autenticado:', error.message);
      throw new Error(`Failed to create authenticated client: ${error.message}`);
    }
  }

  validateGrant(grant) {
    if (!isFinalizedGrant(grant)) {
      throw new Error('Grant not finalized - authentication failed');
    }
    return grant;
  }

  async getWalletInfo(walletUrl) {
    const client = await this.getAuthenticatedClient();
    return await client.walletAddress.get({ url: walletUrl });
  }
}