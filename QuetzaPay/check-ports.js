const net = require('net');
const ports = [3000, 3001, 5173, 80, 443];

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close();
      resolve({ port, status: 'LIBRE' });
    });
    server.on('error', () => {
      resolve({ port, status: 'OCUPADO' });
    });
  });
}

async function checkAllPorts() {
  console.log('🔍 Verificando puertos...\n');
  
  for (const port of ports) {
    const result = await checkPort(port);
    console.log(`Puerto ${port}: ${result.status}`);
  }
  
  console.log('\n💡 Recomendación: Usar puertos 3000 y 3001');
}

checkAllPorts();