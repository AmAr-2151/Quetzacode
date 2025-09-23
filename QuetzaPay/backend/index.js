// backend/index.js
import express from 'express'
import fs from 'fs'
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
import { createAuthenticatedClient } from '@interledger/open-payments'
import { createServer } from 'http'
import { Server as IOServer } from 'socket.io'
import paymentsRouter from './routes/payments.js'

dotenv.config()

const app = express()
app.use(cors({ origin: process.env.ORIGIN || '*' }))
app.use(bodyParser.json())

// mount payments routes
app.use('/api/payments', paymentsRouter)

const httpServer = createServer(app)
const io = new IOServer(httpServer, { cors: { origin: process.env.ORIGIN || '*' } })

// expose io so routes can emit
app.set('io', io)

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
