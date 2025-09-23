import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './config/database.js';
import openPaymentsService from './services/openPaymentsService.js';
import websocketService from './services/websocketService.js';

// Routes
import paymentRoutes from './routes/payments.js';
import merchantRoutes from './routes/merchants.js';
import transactionRoutes from './routes/transactions.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Inicializar WebSocket
websocketService.initialize(server);

// Middleware básico
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a la base de datos
connectDB();

// Inicializar Open Payments
openPaymentsService.initialize()
  .then(() => console.log('✅ Open Payments service initialized'))
  .catch(err => console.error('❌ Open Payments init error:', err));

// Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check con estado de servicios
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'QuetzaPay Backend',
    services: {
      database: 'Unknown',
      openPayments: 'Unknown',
      websocket: websocketService.wss ? 'Running' : 'Stopped'
    }
  };

  try {
    // Verificar base de datos
    const db = require('mongoose');
    healthCheck.services.database = db.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    // Verificar Open Payments
    await openPaymentsService.initialize();
    healthCheck.services.openPayments = 'Connected';
    
    res.json(healthCheck);
  } catch (error) {
    healthCheck.status = 'Degraded';
    healthCheck.error = error.message;
    res.status(503).json(healthCheck);
  }
});

// Manejo de errores
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🚀 QuetzaPay backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI}`);
});