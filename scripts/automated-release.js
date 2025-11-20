import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Configuración
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Cargar variables de entorno
dotenv.config({ path: path.join(rootDir, '.env') });

const GITHUB_OWNER = 'MrXpra';
const GITHUB_REPO = 'MECANET';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('\n🚀 INICIANDO PROCESO DE RELEASE AUTOMATIZADO\n');

    // 0. Verificar Token
    if (!GITHUB_TOKEN) {
        console.warn('⚠️  ADVERTENCIA: No se encontró GITHUB_TOKEN en .env');
        console.warn('   El proceso realizará el build y git push, pero NO podrá subir el release a GitHub automáticamente.');
        const cont = await question('   ¿Desea continuar? (s/n): ');
        if (cont.toLowerCase() !== 's') process.exit(0);
    }

    // 1. Determinar versión y rama
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir }).toString().trim();
    console.log(`   Rama actual: ${currentBranch}`);

    const packageJsonPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = pkg.version;
    
    console.log(`📌 Versión actual: ${currentVersion}`);
    const type = await question('   Tipo de release (patch/minor/major) [patch]: ') || 'patch';

    // Calcular nueva versión (simple)
    let [major, minor, patch] = currentVersion.split('.').map(Number);
    if (type === 'major') { major++; minor = 0; patch = 0; }
    else if (type === 'minor') { minor++; patch = 0; }
    else { patch++; }
    
    const newVersion = `${major}.${minor}.${patch}`;
    console.log(`✨ Nueva versión: ${newVersion}`);

    // 1.5. Gestión del Changelog
    let releaseNotes = '';
    console.log('\n📝 GESTIÓN DEL CHANGELOG');
    console.log('   Es importante documentar los cambios de esta versión.');
    const addToChangelog = await question('   ¿Desea agregar una entrada al CHANGELOG.md? (s/n) [s]: ') || 's';

    if (addToChangelog.toLowerCase() === 's') {
        console.log('\n   Ingrese las notas de la versión (Markdown soportado).');
        console.log('   Ejemplos:');
        console.log('     ### ✨ Agregado');
        console.log('     - Nueva funcionalidad X');
        console.log('     ### 🐛 Corregido');
        console.log('     - Bug Y arreglado');
        console.log('\n   Escriba "FIN" en una línea nueva para terminar la entrada.\n');

        while (true) {
            const line = await question('   > ');
            if (line.trim() === 'FIN') break;
            releaseNotes += line + '\n';
        }

        if (releaseNotes.trim()) {
            const changelogPath = path.join(rootDir, 'CHANGELOG.md');
            if (fs.existsSync(changelogPath)) {
                let content = fs.readFileSync(changelogPath, 'utf8');
                const marker = '---';
                const idx = content.indexOf(marker);
                
                const entryHeader = `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n`;
                const fullEntry = entryHeader + releaseNotes + '\n';

                if (idx !== -1) {
                    // Insertar después del marcador ---
                    const newContent = content.slice(0, idx + marker.length) + '\n\n' + fullEntry + content.slice(idx + marker.length).trimStart();
                    fs.writeFileSync(changelogPath, newContent);
                    console.log('   ✅ CHANGELOG.md actualizado exitosamente.');
                } else {
                    // Si no hay marcador, agregar al principio
                    fs.writeFileSync(changelogPath, fullEntry + content);
                    console.log('   ✅ CHANGELOG.md actualizado (al inicio).');
                }
            }
        }
    }

    const confirm = await question('\n   ¿Proceder con el Release? (s/n): ');
    if (confirm.toLowerCase() !== 's') process.exit(0);

    try {
        // 2. Actualizar archivos de versión
        console.log('\n📝 [1/4] Actualizando versiones...');
        
        // package.json
        pkg.version = newVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

        // version.json
        const versionJsonPath = path.join(rootDir, 'version.json');
        const versionData = {
            version: newVersion,
            lastUpdated: new Date().toISOString().split('T')[0],
            releaseNotes: releaseNotes.trim() || `Release v${newVersion}`
        };
        fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2));

        // client/package.json (si existe)
        const clientPkgPath = path.join(rootDir, 'client', 'package.json');
        if (fs.existsSync(clientPkgPath)) {
            const clientPkg = JSON.parse(fs.readFileSync(clientPkgPath, 'utf8'));
            clientPkg.version = newVersion;
            fs.writeFileSync(clientPkgPath, JSON.stringify(clientPkg, null, 2));
        }

        // 3. Build y Empaquetado
        console.log('\n📦 [2/4] Generando paquete (Build & Zip)...');
        // Ejecutamos el script que creamos anteriormente
        execSync('npm run package:release', { stdio: 'inherit', cwd: rootDir });

        const zipName = `MECANET-v${newVersion}.zip`;
        const zipPath = path.join(rootDir, 'distribucion', zipName);

        if (!fs.existsSync(zipPath)) {
            throw new Error('El archivo ZIP no se generó correctamente.');
        }

        // 4. Git Commit & Push
        console.log('\noctocat [3/4] Sincronizando con GitHub (Git)...');
        execSync('git add .', { stdio: 'inherit', cwd: rootDir });
        
        try {
            execSync(`git commit -m "Release v${newVersion}"`, { stdio: 'inherit', cwd: rootDir });
        } catch (e) {
            console.log('   No hay cambios para commitear (o error en commit). Continuando...');
        }

        console.log('   Bajando cambios remotos para evitar conflictos...');
        try {
            // Intentar traer cambios remotos antes de subir
            execSync(`git pull origin ${currentBranch}`, { stdio: 'inherit', cwd: rootDir });
        } catch (e) {
            console.warn(`⚠️  Advertencia: No se pudo hacer git pull de ${currentBranch}. Es posible que debas resolver conflictos manualmente.`);
        }

        console.log(`   Subiendo cambios a ${currentBranch}...`);
        execSync(`git push origin ${currentBranch}`, { stdio: 'inherit', cwd: rootDir });
        
        // Intentar subir a la otra rama principal también (sincronización básica)
        const otherBranch = currentBranch === 'main' ? 'develop' : (currentBranch === 'develop' ? 'main' : null);
        if (otherBranch) {
            try {
                console.log(`   Intentando sincronizar también con ${otherBranch}...`);
                execSync(`git push origin ${currentBranch}:${otherBranch}`, { stdio: 'inherit', cwd: rootDir });
                console.log(`   ✅ ${otherBranch} actualizado.`);
            } catch (e) {
                console.warn(`   ⚠️  No se pudo actualizar ${otherBranch} automáticamente (probablemente requiere merge).`);
            }
        }

        // Opcional: Tag en git
        // execSync(`git tag v${newVersion}`, { stdio: 'inherit', cwd: rootDir });
        // execSync(`git push origin v${newVersion}`, { stdio: 'inherit', cwd: rootDir });

        // 5. GitHub Release (API)
        if (GITHUB_TOKEN) {
            console.log('\n🚀 [4/4] Creando Release en GitHub...');
            
            // Crear Release
            const createReleaseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
            const releaseData = {
                tag_name: `v${newVersion}`,
                target_commitish: currentBranch,
                name: `v${newVersion}`,
                body: releaseNotes.trim() || `Release automático v${newVersion}`,
                draft: false,
                prerelease: false
            };

            const releaseResponse = await axios.post(createReleaseUrl, releaseData, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const uploadUrl = releaseResponse.data.upload_url.replace('{?name,label}', '');
            console.log('   Release creado. Subiendo asset...');

            // Subir Asset
            const fileContent = fs.readFileSync(zipPath);
            
            await axios.post(`${uploadUrl}?name=${zipName}`, fileContent, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/zip',
                    'Content-Length': fileContent.length
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            console.log('✅ Asset subido exitosamente!');
            console.log(`🔗 Link: ${releaseResponse.data.html_url}`);
        } else {
            console.log('\n⚠️  Paso omitido: No hay GITHUB_TOKEN.');
            console.log(`   Por favor, crea el release manualmente en GitHub y sube el archivo:`);
            console.log(`   📂 ${zipPath}`);
        }

        console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('   Detalles API:', error.response.data);
        }
    } finally {
        rl.close();
    }
}

main();
