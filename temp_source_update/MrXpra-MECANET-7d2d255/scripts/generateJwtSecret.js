import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

/**
 * Script para generar un JWT_SECRET seguro y agregarlo automáticamente al .env
 * Genera una cadena aleatoria de 64 caracteres hexadecimales
 * 
 * Uso:
 * - node scripts/generateJwtSecret.js
 * - Se ejecuta automáticamente en postinstall
 */

function generateSecureJWT() {
  // Genera 32 bytes aleatorios y los convierte a hex (64 caracteres)
  const secret = crypto.randomBytes(32).toString('hex');
  return secret;
}

function updateOrCreateEnvFile(jwtSecret) {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.production.example');
  
  try {
    // Si existe .env, verificar si ya tiene JWT_SECRET
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Si ya tiene JWT_SECRET válido (no placeholder y con comillas), no hacer nada
      if (envContent.match(/JWT_SECRET=['"][a-f0-9]{64}['"]/)) {
        console.log('✅ JWT_SECRET ya existe en .env');
        return false;
      }
      
      // Si tiene placeholder o sin comillas, reemplazarlo
      if (envContent.includes('JWT_SECRET=')) {
        envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET='${jwtSecret}'`);
        fs.writeFileSync(envPath, envContent);
        console.log('✅ JWT_SECRET actualizado en .env');
        return true;
      }
      
      // Si no tiene JWT_SECRET, agregarlo
      envContent += `\nJWT_SECRET='${jwtSecret}'\n`;
      fs.writeFileSync(envPath, envContent);
      console.log('✅ JWT_SECRET agregado a .env');
      return true;
    } else {
      // Si no existe .env, crearlo desde .env.production.example o desde cero
      let envContent = '';
      
      if (fs.existsSync(envExamplePath)) {
        envContent = fs.readFileSync(envExamplePath, 'utf8');
        envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET='${jwtSecret}'`);
      } else {
        envContent = `# Configuración del servidor
PORT=5000

# Base de datos MongoDB
MONGODB_URI=your_mongodb_uri_here

# Secreto para JWT (generado automáticamente)
JWT_SECRET='${jwtSecret}'

# Node environment
NODE_ENV=development
`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Archivo .env creado con JWT_SECRET');
      return true;
    }
  } catch (error) {
    console.error('❌ Error al actualizar .env:', error.message);
    return false;
  }
}

// Detectar si se ejecuta directamente (funciona en Windows, Linux y Mac)
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

// Solo ejecutar si se llama directamente, NO en postinstall
if (isMainModule) {
  const jwtSecret = generateSecureJWT();
  
  console.log('\n🔐 Generando JWT_SECRET seguro...\n');
  
  const updated = updateOrCreateEnvFile(jwtSecret);
  
  if (!updated) {
    console.log('\n📋 JWT_SECRET generado (no se modificó .env):');
    console.log(jwtSecret);
    console.log('\n💡 Puedes usar este valor en tu archivo .env si lo necesitas\n');
  } else {
    console.log('🔑 JWT_SECRET:', jwtSecret);
    console.log('\n⚠️  Guarda este valor de forma segura. No lo compartas con nadie.\n');
  }
}

// Exportar para uso en otros scripts
export { generateSecureJWT, updateOrCreateEnvFile };
