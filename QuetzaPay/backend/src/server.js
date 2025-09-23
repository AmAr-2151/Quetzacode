import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose'; // ← Añade mongoose

// Configuración
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB Atlas:', error);
    process.exit(1);
  }
};

// Rutas básicas
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado';
  
  res.json({ 
    status: 'OK', 
    message: 'QuetzaPay Backend funcionando!',
    database: dbStatus,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Modelo simple de Pago para probar la base de datos
const paymentSchema = new mongoose.Schema({
  amount: Number,
  description: String,
  status: { type: String, default: 'pending' },
  merchantId: String,
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

// Ruta para crear pagos en la base de datos
app.post('/api/payments/create', async (req, res) => {
  try {
    const { amount, description, merchantId } = req.body;
    
    const payment = new Payment({
      amount: amount || 100,
      description: description || 'Pago de prueba',
      merchantId: merchantId || 'merchant_001',
      status: 'pending'
    });
    
    await payment.save();
    
    // Notificar via WebSocket
    io.emit('payment_created', payment);
    
    res.json({
      success: true,
      payment: payment,
      message: 'Pago guardado en MongoDB Atlas correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta para obtener pagos
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(10);
    res.json({
      success: true,
      payments: payments,
      count: payments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('✅ Cliente conectado:', socket.id);
  
  socket.on('join_merchant', (merchantId) => {
    socket.join(merchantId);
    console.log(`🏪 Merchant ${merchantId} unido`);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor después de conectar a la base de datos
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log('🚀 QuetzaPay Backend con MongoDB Atlas');
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
    console.log(`🗄️  Database: MongoDB Atlas`);
    console.log(`⚡ Entorno: ${process.env.NODE_ENV}`);
  });
};

startServer();