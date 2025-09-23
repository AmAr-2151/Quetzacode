import 'dotenv/config';

console.log('🔐 Verificando configuración de Open Payments...\n');

// Verificar variables de entorno
console.log('1. Variables de entorno:');
console.log('   - KEY_ID:', process.env.OPEN_PAYMENTS_KEY_ID ? '✅ Presente' : '❌ Faltante');
console.log('   - WALLET_URL:', process.env.MERCHANT_WALLET_ADDRESS_URL);

// Verificar formato de la clave privada
console.log('\n2. Verificando clave privada:');
const privateKey = process.env.OPEN_PAYMENTS_PRIVATE_KEY;

if (!privateKey) {
  console.log('❌ Clave privada no encontrada');
  process.exit(1);
}

console.log('   - Longitud:', privateKey.length, 'caracteres');
console.log('   - Empieza con BEGIN:', privateKey.startsWith('-----BEGIN PRIVATE KEY-----'));
console.log('   - Termina con END:', privateKey.endsWith('-----END PRIVATE KEY-----'));
console.log('   - Contiene \\n:', privateKey.includes('\\n'));

// Mostrar primeros y últimos caracteres (sin revelar la clave completa)
console.log('\n3. Vista previa de la clave:');
console.log('   - Primeros 50 chars:', privateKey.substring(0, 50));
console.log('   - Últimos 50 chars:', privateKey.substring(privateKey.length - 50));

// Si contiene \n literales, necesitamos convertirlos a saltos de línea reales
if (privateKey.includes('\\n')) {
  console.log('\n⚠️  La clave contiene \\n literales. Convirtiendo a saltos de línea reales...');
  const correctedKey = privateKey.replace(/\\n/g, '\n');
  console.log('   - Clave corregida (primeros 50 chars):', correctedKey.substring(0, 50));
}

console.log('\n✅ Verificación completada');