import mongoose from 'mongoose';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Importar modelos y servicios
// Nota: Usamos import dinámico para Settings porque requiere conexión a DB
import SourceUpdateService from '../services/sourceUpdateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Cargar variables de entorno
dotenv.config({ path: path.join(rootDir, '.env') });

// Definir esquema de Settings inline para evitar cargar todo el modelo y sus dependencias
// Esto hace el script más ligero y menos propenso a errores de dependencias circulares
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

        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'update',
                message: '¿Descargar e instalar actualización?',
                default: true
            }
        ]);

        if (answers.update) {
            try {
                console.log('\n📥 Iniciando descarga...');
                const sourcePath = await SourceUpdateService.downloadSource();
                console.log('   Código descargado en:', sourcePath);
                
                const updateFlagPath = path.join(rootDir, '.update-pending');
                console.log('   Guardando referencia en:', updateFlagPath);
                fs.writeFileSync(updateFlagPath, sourcePath, 'utf8');
                
                console.log('✅ Actualización lista para aplicar.');
                process.exit(2); // Código 2 = Actualización pendiente
            } catch (error) {
                console.error('❌ Error descargando:', error.message);
                console.error('   Stack:', error.stack);
                console.log('\n⚠️  Continuando sin actualizar...');
                process.exit(0);
            }
        } else {
            console.log('ℹ️  Actualización omitida por el usuario.');
        }
    } else {
        console.log('✅ Sistema actualizado.');
    }

    process.exit(0);
}

main();
