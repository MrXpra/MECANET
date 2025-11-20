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
    console.log('\n🔍 [SMART-STARTUP] Iniciando verificación de sistema...');

    // 1. Conectar a MongoDB (Solo para leer configuración)
    // Si no hay .env (instalación limpia), asumimos autoUpdate = true y saltamos conexión
    if (!process.env.MONGODB_URI) {
        console.log('ℹ️  Instalación limpia detectada (Sin .env).');
        console.log('   Se verificará la última versión disponible por defecto.');
    } else {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000
            });

            // 2. Leer configuración solo si hay conexión
            try {
                const settings = await Settings.findOne();
                if (settings && settings.autoUpdate === false) {
                    autoUpdate = false;
                }
            } catch (error) {
                console.log('⚠️  Error leyendo configuración. Usando valores por defecto.');
            }
            
            await mongoose.disconnect();
        } catch (error) {
            console.log('⚠️  No se pudo conectar a la BD. Saltando verificación de configuración personalizada.');
        }
    }

    if (!autoUpdate) {
        console.log('ℹ️  Actualizaciones automáticas desactivadas por configuración.');
        process.exit(0);
    }

    // 3. Verificar Actualización
    console.log('☁️  Verificando nueva versión en GitHub (Source)...');
    const updateInfo = await SourceUpdateService.checkRemoteVersion();

    if (updateInfo.hasUpdate) {
        console.log('\n🚀 ¡NUEVA VERSIÓN DISPONIBLE!');
        console.log(`   Local:  v${updateInfo.localVersion}`);
        console.log(`   Remota: v${updateInfo.remoteVersion}`);
        console.log('   Fuente: Rama principal (main)');

        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'update',
                message: '¿Desea descargar e instalar la actualización ahora?',
                default: true
            }
        ]);

        if (answers.update) {
            try {
                // Descargar código fuente
                const sourcePath = await SourceUpdateService.downloadSource();
                
                // Crear archivo de bandera para que el BAT sepa dónde está el código
                const updateFlagPath = path.join(rootDir, '.update-pending');
                fs.writeFileSync(updateFlagPath, sourcePath, 'utf8');

                console.log('✅ Código fuente descargado y listo para aplicar.');
                await mongoose.disconnect();
                process.exit(2); // Código 2 = Actualización pendiente
            } catch (error) {
                console.error('❌ Error descargando actualización:', error.message);
                await mongoose.disconnect();
                process.exit(0); // Continuar arranque normal si falla descarga
            }
        }
    } else {
        console.log('✅ El sistema está actualizado.');
    }

    await mongoose.disconnect();
    process.exit(0);
}

main();
