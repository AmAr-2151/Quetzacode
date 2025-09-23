import express from 'express';

const router = express.Router();

// Rutas de transactions (para futuras implementaciones)
router.get('/', (req, res) => {
    res.json({ message: 'Transactions endpoint - TODO' });
});

// Exportar el router directamente
export { router as transactionRoutes };