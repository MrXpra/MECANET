import axios from 'axios';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import semver from 'semver';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Cargar variables de entorno para obtener GITHUB_TOKEN si existe
dotenv.config({ path: path.join(rootDir, '.env') });

const GITHUB_OWNER = 'MrXpra';
const GITHUB_REPO = 'MECANET';
const BRANCH = 'main'; // Rama principal de donde descargar el código

/**
 * Servicio para gestionar actualizaciones desde código fuente
 */
class SourceUpdateService {
    
    /**
     * Verifica si hay una nueva versión comparando package.json remoto vs local
     * @returns {Promise<{hasUpdate: boolean, remoteVersion: string, localVersion: string}>}
     */
    async checkRemoteVersion() {
        try {
            // 1. Obtener versión local
            const packageJsonPath = path.join(rootDir, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                throw new Error('No se encuentra package.json local');
            }
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const localVersion = pkg.version;

            // 2. Obtener package.json remoto (RAW) con cache-busting en la URL
            const timestamp = Date.now();
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${BRANCH}/package.json?t=${timestamp}`;
            
            const config = {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            };
            
            if (process.env.GITHUB_TOKEN) {
                config.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
            }

            const response = await axios.get(rawUrl, config);
            const remotePkg = response.data;
            const remoteVersion = remotePkg.version;

            // 3. Comparar versiones
            const hasUpdate = semver.gt(remoteVersion, localVersion);

            return {
                hasUpdate,
                localVersion,
                remoteVersion
            };

        } catch (error) {
            console.error('Error verificando versión remota:', error.message);
            return { hasUpdate: false, error: error.message };
        }
    }

    /**
     * Descarga el código fuente (zipball) y lo prepara para instalación
     * @returns {Promise<string>} Ruta de la carpeta extraída lista para copiar
     */
    async downloadSource() {
        const tempDir = path.join(rootDir, 'temp_source_update');
        const zipPath = path.join(tempDir, 'source.zip');

        // Limpiar directorio temporal si existe
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        fs.mkdirSync(tempDir);

        console.log('⬇️  Descargando código fuente desde GitHub...');
        
        // URL del zipball de la rama main
        const zipUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/zipball/${BRANCH}`;
        
        const config = { responseType: 'stream' };
        if (process.env.GITHUB_TOKEN) {
            config.headers = { 'Authorization': `token ${process.env.GITHUB_TOKEN}` };
        }

        const response = await axios.get(zipUrl, config);
        const writer = fs.createWriteStream(zipPath);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log('📦 Descomprimiendo...');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(tempDir, true);

        // GitHub extrae en una carpeta con hash (ej: MrXpra-MECANET-a1b2c3d)
        // Necesitamos encontrar esa carpeta
        const files = fs.readdirSync(tempDir);
        const sourceFolder = files.find(file => fs.statSync(path.join(tempDir, file)).isDirectory());

        if (!sourceFolder) {
            throw new Error('No se encontró la carpeta de código fuente en el ZIP');
        }

        const finalSourcePath = path.join(tempDir, sourceFolder);
        
        // Eliminar el ZIP para ahorrar espacio
        fs.unlinkSync(zipPath);

        return finalSourcePath;
    }
}

export default new SourceUpdateService();
