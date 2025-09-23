// backend/routes/payments.js
import express from 'express'
import fs from 'fs'
import path from 'path'
import { createAuthenticatedClient } from '@interledger/open-payments'
const router = express.Router()

// helper: init client (cache if quieres)
async function makeClient() {
  try {
    const walletAddress = process.env.WALLET_ADDRESS
    const keyId = process.env.KEY_ID
    
    if (!walletAddress || !keyId) {
      throw new Error('Faltan variables de entorno: WALLET_ADDRESS o KEY_ID')
    }

    let privateKey = process.env.PRIVATE_KEY_BASE64
    if (!privateKey) {
      const keyPath = process.env.PRIVATE_KEY_PATH || './private.key'
      if (!fs.existsSync(keyPath)) {
        throw new Error(`Archivo de clave privada no encontrado: ${keyPath}`)
      }
      privateKey = fs.readFileSync(keyPath, 'utf8')
    }

    return await createAuthenticatedClient({
      walletAddress,
      privateKey,
      keyId
    })
  } catch (error) {
    console.error('Error creando cliente:', error)
    throw error
  }
}

// 1) Obtener info de walletAddress (assetScale / code / authServer / resourceServer)
router.get('/wallet-info', async (req, res) => {
  try {
    const client = await makeClient()
    const info = await client.walletAddress.get({ url: process.env.WALLET_ADDRESS })
    res.json(info)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// 2) Crear incoming payment
router.post('/incoming-payments', async (req, res) => {
  try {
    const { incomingAmount, metadata } = req.body
    const client = await makeClient()
    const incomingPaymentClient = createIncomingPaymentClient({ client })

    const created = await incomingPaymentClient.create({
      walletAddressUrl: process.env.WALLET_ADDRESS,
      incomingAmount: {
        value: String(incomingAmount),
        assetCode: 'USD',
        assetScale: 2
      },
      metadata
    })
    res.status(201).json(created)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})



// 3) Crear quote para payerWallet (quote describe cuánto debe debitarse del pagador)
router.post('/quotes', async (req, res) => {
  try {
    const { payerWalletUrl, incomingPaymentUrl } = req.body
    const client = await makeClient()

    // get recipient wallet info (to know assetCode/scale) and sender wallet info
    const recipientInfo = await client.walletAddress.get({ url: process.env.WALLET_ADDRESS })
    const senderInfo = await client.walletAddress.get({ url: payerWalletUrl })

    // create quote on sender's resource server
    // The library handles auth flow for resource server endpoints using the client methods
    const quote = await client.quotes.create({
      body: {
        receiver: incomingPaymentUrl,
        // the amount received by receiver (e.g. in receiver's units)
        receiveAmount: { value: '100', assetCode: recipientInfo.assetCode, assetScale: recipientInfo.assetScale },
        // optional metadata
      },
      // the quote needs to be created on the sender's resource server
      resourceServerUrl: senderInfo.resourceServer
    })

    res.status(201).json(quote)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// 4) Create outgoing payment (this requires an interactive grant flow in general)
router.post('/outgoing-payments', async (req, res) => {
  try {
    const { payerWalletUrl, quoteId, continueUrl } = req.body
    const client = await makeClient()
    // 1) request an interactive outgoing grant against payer wallet's auth server
    const payerInfo = await client.walletAddress.get({ url: payerWalletUrl })
    const authServer = payerInfo.authServer

    // request an interactive grant - the open-payments client will return grant details incl a redirect URL
    const grantRequest = await client.grants.create({
      body: {
        type: 'outgoing-payment',
        actions: ['create'],
        identifier: payerWalletUrl,
        limits: { receiver: quoteId } // simplified; use correct structure required by API
      },
      authServerUrl: authServer,
      continueUrl // where the wallet will redirect the user after interactive consent
    })

    // client.grants.create returns information to redirect user or continue the flow
    res.status(201).json(grantRequest)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// 5) webhook endpoint (wallet/resource server can call when incoming payment completed)
// Configura en la test wallet para que haga POST aquí cuando un incoming payment reciba fondos
router.post('/webhook/incoming-payment-updated', (req, res) => {
  const io = req.app.get('io')
  const body = req.body
  // simple example: notify frontend via socket.io
  io.emit('incoming_payment_updated', body)
  res.status(200).json({ received: true })
})

export default router
