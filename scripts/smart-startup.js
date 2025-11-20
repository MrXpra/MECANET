import mongoose from 'mongoose';
import readline from 'readline';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Importar servicios
import SourceUpdateService from '../services/sourceUpdateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Cargar variables de entorno
dotenv.config({ path: path.join(rootDir, '.env') });

// Helper para readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Definir esquema de Settings inline
const settingsSchema = new mongoose.Schema({
    autoUpdate: { type: Boolean, default: true }
}, { strict: false });

const Settings = mongoose.model('Settings', settingsSchema);

async function main() {
    console.log('\n🔍 Verificando actualizaciones...');

    // Variable para controlar si las actualizaciones están activadas
    let autoUpdate = true;

    // 1. Conectar a MongoDB (Solo para leer configuración)
    if (!process.env.MONGODB_URI) {
        console.log('ℹ️  Primera instalación detectada.');
    } else {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000
            });

            // 2. Leer configuración
            try {
                const settings = await Settings.findOne();
                if (settings && settings.autoUpdate === false) {
                    autoUpdate = false;
                }
            } catch (error) {
                // Ignorar errores de lectura
            }
            
            await mongoose.disconnect();
        } catch (error) {
            // Si no puede conectar a BD, continuar normal
        }
    }

    if (!autoUpdate) {
        console.log('ℹ️  Actualizaciones automáticas desactivadas.');
        process.exit(0);
    }

    // 3. Verificar Actualización
    console.log('☁️  Consultando última versión...');
    const updateInfo = await SourceUpdateService.checkRemoteVersion();

    if (updateInfo.hasUpdate) {
        console.log('\n🚀 Nueva versión disponible');
        console.log(`   Actual:  v${updateInfo.localVersion}`);
        console.log(`   Nueva:   v${updateInfo.remoteVersion}`);

        const answer = await question('\n¿Descargar e instalar actualización? (s/n): ');
        
        if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            try {
                console.log('\n📥 Iniciando descarga...');
                const sourcePath = await SourceUpdateService.downloadSource();
                console.log('   Código descargado en:', sourcePath);
                
                const updateFlagPath = path.join(rootDir, '.update-pending');
                console.log('   Guardando referencia en:', updateFlagPath);
                fs.writeFileSync(updateFlagPath, sourcePath, 'utf8');
                
                console.log('✅ Actualización lista para aplicar.');
                rl.close();
                process.exit(2); // Código 2 = Actualización pendiente
            } catch (error) {
                console.error('❌ Error descargando:', error.message);
                console.error('   Stack:', error.stack);
                console.log('\n⚠️  Continuando sin actualizar...');
                rl.close();
                process.exit(0);
            }
        } else {
            console.log('ℹ️  Actualización omitida por el usuario.');
        }
    } else {
        console.log('✅ Sistema actualizado.');
    }

    rl.close();
    process.exit(0);
}

main();
