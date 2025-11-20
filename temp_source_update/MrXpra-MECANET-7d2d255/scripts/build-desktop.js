const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Leer versión del package.json
const packageJson = require('../package.json');
const version = packageJson.version;

console.log(`🚀 Iniciando build para Escritorio v${version}...`);

try {
  // 1. Build del Frontend
  console.log('📦 Compilando Frontend...');
  execSync('cd client && npm install && npm run build', { stdio: 'inherit' });

  // 2. Build del Ejecutable con PKG
  console.log('🔨 Generando ejecutable...');
  const outputName = `distribucion/MECANET-v${version}.exe`;
  
  // Asegurar que existe directorio distribucion
  if (!fs.existsSync('distribucion')) {
    fs.mkdirSync('distribucion');
  }

  // Ejecutar pkg
  // Nota: Usamos --compress GZip para reducir tamaño
  execSync(`pkg . --compress GZip --output "${outputName}" --targets node18-win-x64`, { stdio: 'inherit' });

  console.log(`✅ Build completado exitosamente: ${outputName}`);
  
} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
}
