import express from 'express'
import fs from 'fs'
import { createAuthenticatedClient } from '@interledger/open-payments'

const router = express.Router()

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

// 1) Obtener info de walletAddress
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

// 2) Crear incoming payment (VERSIÓN CORREGIDA)
router.post('/incoming-payments', async (req, res) => {
  try {
    const { incomingAmount, metadata } = req.body
    const client = await makeClient()

    // CORRECCIÓN: Usar client.incomingPayment directamente
    const created = await client.incomingPayment({
      walletAddress: process.env.WALLET_ADDRESS,
      incomingAmount: {
        value: String(incomingAmount),
        assetCode: 'USD',
        assetScale: 2
      },
      metadata
    })
    
    res.status(201).json(created)
  } catch (err) {
    console.error('Error detallado:', err)
    res.status(500).json({ 
      error: err.message,
      details: err.response?.data || err 
    })
  }
})

// 3) Crear quote (CORREGIDO)
router.post('/quotes', async (req, res) => {
  try {
    const { payerWalletUrl, incomingPaymentUrl, amount } = req.body
    const client = await makeClient()

    const recipientInfo = await client.walletAddress.get({ url: process.env.WALLET_ADDRESS })
    const senderInfo = await client.walletAddress.get({ url: payerWalletUrl })

    // CORRECCIÓN: Usar client.quote directamente
    const quote = await client.quote({
      walletAddress: payerWalletUrl,
      receiver: incomingPaymentUrl,
      receiveAmount: { 
        value: String(amount), 
        assetCode: recipientInfo.assetCode, 
        assetScale: recipientInfo.assetScale 
      }
    })

    res.status(201).json(quote)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// 4) Create outgoing payment (CORREGIDO)
router.post('/outgoing-payments', async (req, res) => {
  try {
    const { payerWalletUrl, quoteId, continueUrl } = req.body
    const client = await makeClient()
    
    const payerInfo = await client.walletAddress.get({ url: payerWalletUrl })
    const authServer = payerInfo.authServer

    // CORRECCIÓN: Usar client.grant directamente
    const grantRequest = await client.grant(
      {
        access_token: {
          access: [
            {
              type: 'outgoing-payment',
              actions: ['create'],
              identifier: payerWalletUrl
            }
          ]
        },
        interact: {
          start: ['redirect'],
          finish: {
            method: 'redirect',
            uri: continueUrl
          }
        }
      },
      authServer
    )

    res.status(201).json(grantRequest)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// 5) webhook endpoint
router.post('/webhook/incoming-payment-updated', (req, res) => {
  const io = req.app.get('io')
  const body = req.body
  io.emit('incoming_payment_updated', body)
  res.status(200).json({ received: true })
})

export default router