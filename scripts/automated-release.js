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

    const args = process.argv.slice(2);
    const argType = args.find(a => a.startsWith('--type='))?.split('=')[1];
    const argComment = args.find(a => a.startsWith('--comment='))?.substring(10);
    const argYes = args.includes('--yes') || args.includes('-y');

    // 0. Verificar Token
    if (!GITHUB_TOKEN) {
        console.warn('⚠️  ADVERTENCIA: No se encontró GITHUB_TOKEN en .env');
        console.warn('   El proceso realizará el build y git push, pero NO podrá subir el release a GitHub automáticamente.');
        if (!argYes) {
            const cont = await question('   ¿Desea continuar? (s/n): ');
            if (cont.toLowerCase() !== 's') process.exit(0);
        }
    }

    // 1. Determinar versión y rama
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir }).toString().trim();
    console.log(`   Rama actual: ${currentBranch}`);

    const packageJsonPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = pkg.version;

    console.log(`📌 Versión actual: ${currentVersion}`);
    
    let type = argType;
    if (!type) {
        type = await question('   Tipo de release (patch/minor/major) [patch]: ') || 'patch';
    }

    let customComment = argComment;
    if (customComment === undefined) {
        customComment = await question('   Comentario del release: ') || '';
    }

    // Calcular nueva versión (simple)
    let [major, minor, patch] = currentVersion.split('.').map(Number);
    if (type === 'major') { major++; minor = 0; patch = 0; }
    else if (type === 'minor') { minor++; patch = 0; }
    else { patch++; }

    const newVersion = `${major}.${minor}.${patch}`;
    console.log(`✨ Nueva versión: ${newVersion}`);

    if (!argYes) {
        const confirm = await question('\n   ¿Proceder con el Release? (s/n): ');
        if (confirm.toLowerCase() !== 's') process.exit(0);
    }

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
            releaseNotes: customComment || `Release v${newVersion}`
        };
        fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2));

        // client/package.json (si existe)
        const clientPkgPath = path.join(rootDir, 'client', 'package.json');
        if (fs.existsSync(clientPkgPath)) {
            const clientPkg = JSON.parse(fs.readFileSync(clientPkgPath, 'utf8'));
            clientPkg.version = newVersion;
            fs.writeFileSync(clientPkgPath, JSON.stringify(clientPkg, null, 2));
        }

        // 3. Build y Empaquetado (SOLO LOCAL)
        // Aunque ya no subimos el ZIP a GitHub, lo generamos localmente por si acaso
        console.log('\n📦 [2/4] Generando paquete local (Backup)...');
        try {
            execSync('npm run package:release', { stdio: 'inherit', cwd: rootDir });
        } catch (e) {
            console.warn('⚠️  Error generando ZIP local. Continuando...');
        }

        // 4. Git Commit & Push
        console.log('\noctocat [3/4] Sincronizando con GitHub (Git)...');
        execSync('git add .', { stdio: 'inherit', cwd: rootDir });

        try {
            const commitMsg = customComment ? `Release v${newVersion} - ${customComment}` : `Release v${newVersion}`;
            execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit', cwd: rootDir });
        } catch (e) {
            console.log('   No hay cambios para commitear (o error en commit). Continuando...');
        }

        console.log('   Bajando cambios remotos para evitar conflictos...');
        try {
            execSync(`git pull origin ${currentBranch}`, { stdio: 'inherit', cwd: rootDir });
        } catch (e) {
            console.warn(`⚠️  Advertencia: No se pudo hacer git pull de ${currentBranch}.`);
        }

        console.log(`   Subiendo cambios a ${currentBranch}...`);
        execSync(`git push origin ${currentBranch}`, { stdio: 'inherit', cwd: rootDir });

        // Sincronizar ramas
        const otherBranch = currentBranch === 'main' ? 'develop' : (currentBranch === 'develop' ? 'main' : null);
        if (otherBranch) {
            try {
                console.log(`   Intentando sincronizar también con ${otherBranch}...`);
                execSync(`git push origin ${currentBranch}:${otherBranch}`, { stdio: 'inherit', cwd: rootDir });
                console.log(`   ✅ ${otherBranch} actualizado.`);
            } catch (e) {
                console.warn(`   ⚠️  No se pudo actualizar ${otherBranch} automáticamente.`);
            }
        }

        // 5. GitHub Release (SOLO TAG, SIN ZIP)
        if (GITHUB_TOKEN) {
            console.log('\n🚀 [4/4] Creando Tag en GitHub...');

            // Crear Release (Solo metadatos, sin adjuntos)
            const createReleaseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
            const releaseData = {
                tag_name: `v${newVersion}`,
                target_commitish: currentBranch,
                name: `v${newVersion}`,
                body: customComment || `Release automático v${newVersion}`,
                draft: false,
                prerelease: false
            };

            const releaseResponse = await axios.post(createReleaseUrl, releaseData, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            console.log('   ✅ Release (Tag) creado exitosamente!');
            console.log(`   🔗 Link: ${releaseResponse.data.html_url}`);
            console.log('   ℹ️  Nota: No se subió ningún ZIP. El sistema se actualizará desde el código fuente.');
        } else {
            console.log('\n⚠️  GITHUB_TOKEN no configurado. No se creó el release en GitHub.');
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
