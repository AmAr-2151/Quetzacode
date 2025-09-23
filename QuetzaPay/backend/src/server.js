import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './config/database.js';
import openPaymentsService from './services/openPaymentsService.js';

// Importar rutas
import { paymentRoutes } from './routes/payments.js';
import { merchantRoutes } from './routes/merchants.js';
import { transactionRoutes } from './routes/transactions.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// ✅ CONFIGURACIÓN CORS CORREGIDA
app.use(cors({
    origin: true, // Permite todos los orígenes
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a la base de datos
connectDB().catch(err => {
    console.error('❌ Error conectando a MongoDB:', err.message);
});

// Inicializar Open Payments
openPaymentsService.initialize()
    .then(() => {
        const status = openPaymentsService.getConnectionStatus();
        console.log(`✅ Servicio de pagos: ${status.mode.toUpperCase()}`);
    })
    .catch(err => {
        console.log('⚠️  Servicio de pagos en modo simulado');
    });

// ✅ RUTAS CORREGIDAS - agregar /api prefix
app.use('/api/payments', paymentRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/transactions', transactionRoutes);

// ✅ ENDPOINTS SIMPLES CORREGIDOS
app.get('/api/simple-test', (req, res) => {
    res.json({ 
        message: '✅ Backend funcionando correctamente!',
        timestamp: new Date().toISOString(),
        simple: true,
        version: '1.0.0'
    });
});

app.get('/api/health', async (req, res) => {
    try {
        const status = openPaymentsService.getConnectionStatus();
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'QuetzaPay Backend',
            mode: status.mode,
            services: {
                database: 'connected',
                openPayments: status.isConnected ? 'connected' : status.mode
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message
        });
    }
});

app.post('/api/simple-payment', (req, res) => {
    try {
        const { amount = "100" } = req.body;
        
        res.json({
            success: true,
            message: 'Pago de prueba creado exitosamente',
            amount: amount,
            currency: 'MXN',
            transactionId: 'test-' + Date.now(),
            paymentUrl: `quetza-payment://test-${Date.now()}`,
            mode: 'simulated',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta raíz del API
app.get('/api', (req, res) => {
    res.json({
        message: '🚀 QuetzaPay API',
        endpoints: {
            health: '/api/health',
            simpleTest: '/api/simple-test',
            simplePayment: '/api/simple-payment (POST)',
            payments: '/api/payments'
        },
        timestamp: new Date().toISOString()
    });
});

// Ruta raíz del servidor
app.get('/', (req, res) => {
    res.json({
        message: '🛠️ QuetzaPay Backend Server',
        api: 'Visita /api para ver los endpoints disponibles',
        frontend: 'http://localhost:3000',
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('Error global:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// Manejo de 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        availableEndpoints: [
            'GET /',
            'GET /api',
            'GET /api/health',
            'GET /api/simple-test',
            'POST /api/simple-payment',
            'POST /api/payments'
        ]
    });
});

server.listen(PORT, () => {
    console.log(`🚀 QuetzaPay backend running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Backend: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
});