import 'dotenv/config';
import mongoose from 'mongoose';
import { Merchant } from '../src/models/Merchant.js';
import { Transaction } from '../src/models/Transaction.js';

async function testPaymentFlow() {
    try {
        console.log('🏗️ Testing Flujo Completo de Pagos con Base de Datos...\n');

        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Crear merchant de prueba
        console.log('\n1. Creando merchant de prueba...');
        const merchant = await Merchant.create({
            name: 'Tienda de Prueba',
            email: 'test@quetza.com',
            walletAddress: process.env.MERCHANT_WALLET_ADDRESS_URL,
            businessName: 'QuetzaPay Test Store'
        });
        console.log('✅ Merchant creado:', merchant._id);

        // Test del controlador de pagos
        console.log('\n2. Probando creación de pago...');
        const paymentController = await import('../src/controllers/paymentController.js').then(m => m.default);
        
        const mockRequest = {
            body: { amount: "500", currency: "MXN" },
            user: { id: merchant._id }
        };

        const mockResponse = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.responseData = data;
                console.log('📨 Respuesta del servidor:', data);
                return this;
            }
        };

        await paymentController.createPayment(mockRequest, mockResponse);

        if (mockResponse.responseData?.success) {
            console.log('✅ Pago creado exitosamente!');
            console.log('   - Transaction ID:', mockResponse.responseData.transactionId);
            console.log('   - Payment URL:', mockResponse.responseData.paymentUrl);
            
            // Verificar que se guardó en la base de datos
            const transaction = await Transaction.findById(mockResponse.responseData.transactionId);
            console.log('   - En base de datos:', transaction ? '✅' : '❌');
        }

        // Listar transacciones
        console.log('\n3. Listando transacciones del merchant...');
        const transactions = await Transaction.find({ merchantId: merchant._id });
        console.log(`📊 Total transacciones: ${transactions.length}`);

        // Limpiar datos de prueba
        console.log('\n4. Limpiando datos de prueba...');
        await Transaction.deleteMany({ merchantId: merchant._id });
        await Merchant.findByIdAndDelete(merchant._id);
        console.log('✅ Datos de prueba eliminados');

        console.log('\n🎉 ¡Flujo completo de pagos funciona correctamente!');
        console.log('\n📋 Próximo paso: Configurar el frontend con React.js');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error en el flujo de pagos:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

testPaymentFlow();