import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import openPaymentsService from './services/openPaymentsService.js';

// Routes
import paymentRoutes from './routes/payments.js';
import merchantRoutes from './routes/merchants.js';
import transactionRoutes from './routes/transactions.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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
  .then(() => console.log('Open Payments service initialized'))
  .catch(err => console.error('Open Payments init error:', err));

// Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'QuetzaPay Backend'
  });
});

// Manejo de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`QuetzaPay backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});