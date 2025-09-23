import express from 'express';

const router = express.Router();

// Rutas de merchants (para futuras implementaciones)
router.get('/', (req, res) => {
    res.json({ message: 'Merchants endpoint - TODO' });
});

router.get('/:id', (req, res) => {
    res.json({ message: `Merchant ${req.params.id} - TODO` });
});

// Exportar el router directamente
export { router as merchantRoutes };