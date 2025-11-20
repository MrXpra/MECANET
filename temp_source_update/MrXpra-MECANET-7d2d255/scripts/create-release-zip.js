import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Leer versión
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

console.log(`🚀 Preparando Release v${version} para GitHub...`);

// 1. Compilar Frontend
console.log('🏗️  Compilando Frontend...');
console.log('   (Nota: Se instalarán dependencias TEMPORALES para compilar, pero NO se incluirán en el ZIP)');

try {
    // Aseguramos que se instalen dependencias del cliente (incluyendo devDependencies para Vite)
    // Usamos --production=false para ignorar NODE_ENV=production si estuviera seteado
    console.log('   Instalando dependencias de compilación...');
    execSync('cd client && npm install --production=false', { stdio: 'inherit', cwd: rootDir });
    
    console.log('   Generando archivos estáticos (dist)...');
    execSync('cd client && npm run build', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
    console.error('❌ Error compilando frontend:', e.message);
    process.exit(1);
}

// 2. Crear ZIP
const zip = new AdmZip();
const outputDir = path.join(rootDir, 'distribucion');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
const outputPath = path.join(outputDir, `MECANET-v${version}.zip`);

console.log('📦 Empaquetando archivos...');

// Archivos raíz a incluir
const rootFiles = [
    'package.json', 
    'package-lock.json', 
    'version.json', 
    'server.js', 
    'start.cjs', 
    'wrapper.cjs', 
    'nodemon.json', 
    'README.md', 
    'CHANGELOG.md',
    // Incluir bats si existen en la raíz (para actualizaciones de scripts de inicio)
    'INICIAR-MECANET.bat', 
    'CONFIGURAR-INICIAL.bat'
];

rootFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        zip.addLocalFile(filePath);
    }
});

// Carpetas a incluir
const folders = [
    'config', 
    'controllers', 
    'middleware', 
    'models', 
    'routes', 
    'services', 
    'scripts', 
    'docs',
    'sistema'
];

folders.forEach(folder => {
    const folderPath = path.join(rootDir, folder);
    if (fs.existsSync(folderPath)) {
        // addLocalFolder añade el contenido de la carpeta dentro de una carpeta en el zip
        // Si pasamos el segundo argumento, crea esa carpeta dentro del zip
        zip.addLocalFolder(folderPath, folder);
    }
});

// Incluir Frontend compilado (client/dist)
const clientDistPath = path.join(rootDir, 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
    zip.addLocalFolder(clientDistPath, 'client/dist');
} else {
    console.error('❌ Error: client/dist no existe. La compilación falló.');
    process.exit(1);
}

// Incluir package.json del cliente (opcional, pero útil)
const clientPkg = path.join(rootDir, 'client', 'package.json');
if (fs.existsSync(clientPkg)) {
    zip.addLocalFile(clientPkg, 'client');
}

// 3. Guardar ZIP
console.log(`💾 Guardando ZIP en: ${outputPath}`);
zip.writeZip(outputPath);

console.log(`
✅ ZIP de Release creado exitosamente!
   Archivo: ${outputPath}
   
⚠️  INSTRUCCIONES PARA GITHUB RELEASES:
   1. Crea un nuevo Release en GitHub con el tag v${version}
   2. Sube este archivo .zip como asset.
   3. NO subas node_modules ni .env (el script ya los excluyó).
   4. El cliente descargará este zip y ejecutará 'npm install --production' automáticamente.
`);
