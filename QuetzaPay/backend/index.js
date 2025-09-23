import { createAuthenticatedClient, isFinalizedGrant } from '@interledger/open-payments';
import fs, { access } from 'fs';

(async () => {
    try {
        const privateKey = fs.readFileSync("private.key", "utf8");
        const client = await createAuthenticatedClient({
            walletAddressUrl: "https://ilp.interledger-test.dev/cesarh225", // Wallet autenticada
            privateKey,
            keyId: "627cbc5e-217d-4ab2-8db0-e4a2e7b662bf"
        });

        const sendingWalletAddress = await client.walletAddress.get({
            url: "https://ilp.interledger-test.dev/cesarh225"
        });

        const receivingWalletAddress = await client.walletAddress.get({
            url: "https://ilp.interledger-test.dev/143b92ee"
        });

        console.log("Sending Wallet:", sendingWalletAddress);
        console.log("Receiving Wallet:", receivingWalletAddress);

        const incomingPaymentGrant = await client.grant.request(
            { url: receivingWalletAddress.authServer },
            {
                access_token: {
                    access: [
                        {
                            type: "incoming-payment",
                            actions: ["create"]
                        }
                    ]
                }
            }
        );

        if (!isFinalizedGrant(incomingPaymentGrant)) {
            throw new Error('El grant no está finalizado');
        }

        console.log(incomingPaymentGrant);

        
    const incomingPayment = await client.incomingPayment.create(
        {
        url: receivingWalletAddress.resourceServer,
        accessToken: incomingPaymentGrant.access_token.value,
    },{
        walletAddress: receivingWalletAddress.id,
        incomingAmount: {
                assetCode: receivingWalletAddress.assetCode,
                assetScale: receivingWalletAddress.assetScale,
                value: "1000" // 10.00 USD
    }
}
);
        console.log({incomingPayment});

        const quoteGrant = await client.grant.request(
        {
            url: sendingWalletAddress.authServer,
        },
        {
            access_token: {
                access: [
                    {
                        type: "quote",
                        actions: ["create"],   
                    }
                ]
             }
        }
        );

        if (!isFinalizedGrant(quoteGrant)) {
            throw new Error("El grant no está finalizado");
        }
        console.log(quoteGrant);

        

    } catch (error) {
        console.error("Error:", error);
    }


})();
