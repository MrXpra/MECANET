import fs from 'fs';
import path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import semver from 'semver';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const GITHUB_OWNER = 'MrXpra';
const GITHUB_REPO = 'MECANET';

async function main() {
    try {
        // 1. Obtener versión local
        const packageJsonPath = path.join(rootDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            console.error('❌ No se encuentra package.json');
            process.exit(0);
        }
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const localVersion = pkg.version;

        console.log(`📌 Versión local: ${localVersion}`);

        // 2. Consultar última versión en GitHub
        console.log('☁️  Verificando actualizaciones en GitHub...');
        const releaseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
        
        const response = await axios.get(releaseUrl, {
            headers: { 'User-Agent': 'MECANET-Updater' },
            timeout: 5000
        });

        const latestVersionTag = response.data.tag_name;
        const latestVersion = latestVersionTag.replace(/^v/, ''); // Quitar 'v' si existe

        console.log(`✨ Última versión disponible: ${latestVersion}`);

        // 3. Comparar versiones
        if (semver.gt(latestVersion, localVersion)) {
            console.log('\n🚀 ¡NUEVA VERSIÓN DISPONIBLE!');
            console.log(`   Se actualizará de v${localVersion} a v${latestVersion}`);
            
            const answers = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'update',
                    message: '¿Desea descargar e instalar la actualización ahora?',
                    default: true
                }
            ]);

            if (answers.update) {
                console.log('\n⬇️  Descargando actualización...');
                
                // Buscar el asset zip
                const assets = response.data.assets;
                const zipAsset = assets.find(a => a.name.endsWith('.zip'));
                
                if (!zipAsset) {
                    console.error('❌ No se encontró un archivo ZIP en el release.');
                    process.exit(0);
                }

                const downloadUrl = zipAsset.browser_download_url;
                const tempDir = path.join(rootDir, 'temp_update');
                const zipPath = path.join(tempDir, 'update.zip');

                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

                // Descargar archivo
                const writer = fs.createWriteStream(zipPath);
                const dlResponse = await axios({
                    url: downloadUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                dlResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                console.log('📦 Descomprimiendo archivos...');
                const zip = new AdmZip(zipPath);
                zip.extractAllTo(tempDir, true);

                // Eliminar el zip descargado para dejar solo los archivos extraídos
                fs.unlinkSync(zipPath);

                console.log('✅ Descarga completada. Aplicando cambios...');
                process.exit(2); // Código especial para indicar al BAT que actualice
            }
        } else {
            console.log('✅ El sistema está actualizado.');
        }

    } catch (error) {
        console.error('\n⚠️  No se pudo verificar actualizaciones.');
        console.error(`   Error: ${error.message}`);
        // No detener el flujo si falla la red
    }
    
    process.exit(0);
}

main();
