// Archivo de inicio simple para pruebas
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        message: '✅ ¡Backend funcionando!',
        timestamp: new Date().toISOString(),
        nextStep: 'Probar con el servidor completo'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor simple en http://localhost:${PORT}`);
});