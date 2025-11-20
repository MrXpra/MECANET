import axios from 'axios';
import AdmZip from 'adm-zip';
import semver from 'semver';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Configuración del repositorio
const GITHUB_OWNER = 'MrXpra'; // Reemplazar con el usuario real
const GITHUB_REPO = 'MECANET'; // Reemplazar con el repo real

class UpdaterService {
  constructor() {
    this.updateUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
  }

  /**
   * Obtiene la versión actual del package.json
   */
  getCurrentVersion() {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  }

  /**
   * Busca actualizaciones en GitHub
   */
  async checkForUpdates() {
    try {
      console.log('🔍 Buscando actualizaciones en GitHub...');
      const response = await axios.get(this.updateUrl);
      const release = response.data;
      
      const currentVersion = this.getCurrentVersion();
      const latestVersion = release.tag_name.replace('v', ''); // Quitar 'v' si existe

      console.log(`   Versión actual: ${currentVersion}`);
      console.log(`   Última versión: ${latestVersion}`);

      if (semver.gt(latestVersion, currentVersion)) {
        // Buscar el asset .zip
        const asset = release.assets.find(a => a.name.endsWith('.zip'));
        
        if (!asset) {
          throw new Error('No se encontró un archivo .zip en la última release.');
        }

        return {
          hasUpdate: true,
          version: latestVersion,
          downloadUrl: asset.browser_download_url,
          releaseNotes: release.body,
          name: release.name
        };
      }

      return { hasUpdate: false, version: currentVersion };
    } catch (error) {
      console.error('❌ Error buscando actualizaciones:', error.message);
      throw error;
    }
  }

  /**
   * Descarga y aplica la actualización
   */
  async downloadAndApplyUpdate(downloadUrl) {
    const tempZipPath = path.join(rootDir, 'temp_update.zip');
    const tempExtractPath = path.join(rootDir, 'temp_extract');

    try {
      // 1. Descargar
      console.log('⬇️  Descargando actualización...');
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'arraybuffer'
      });

      fs.writeFileSync(tempZipPath, response.data);
      console.log('✅ Descarga completada.');

      // 2. Descomprimir
      console.log('📦 Descomprimiendo...');
      const zip = new AdmZip(tempZipPath);
      
      // Limpiar carpeta temporal si existe
      if (fs.existsSync(tempExtractPath)) {
        fs.rmSync(tempExtractPath, { recursive: true, force: true });
      }
      fs.mkdirSync(tempExtractPath);

      zip.extractAllTo(tempExtractPath, true);
      console.log('✅ Descompresión completada.');

      // 3. Generar script de actualización
      this.generateUpdateScript(tempExtractPath, tempZipPath);

      // 4. Ejecutar script y salir
      this.executeUpdateScript();

      return { success: true, message: 'Actualización iniciada. El sistema se reiniciará.' };

    } catch (error) {
      console.error('❌ Error aplicando actualización:', error);
      // Limpieza en caso de error
      if (fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
      if (fs.existsSync(tempExtractPath)) fs.rmSync(tempExtractPath, { recursive: true, force: true });
      throw error;
    }
  }

  /**
   * Genera el archivo update.bat
   */
  generateUpdateScript(extractPath, zipPath) {
    const batPath = path.join(rootDir, 'update.bat');
    const extractDirName = 'temp_extract';
    const zipFileName = 'temp_update.zip';

    // Comandos del batch script
    // Nota: Agregamos protección para .env
    const batContent = `
@echo off
title Actualizando MECANET...
color 0A

echo ==========================================
echo      ACTUALIZANDO SISTEMA MECANET
echo ==========================================
echo.
echo 1. Esperando cierre del servidor...
timeout /t 5 /nobreak > nul

echo.
echo 2. Protegiendo configuracion local...
if exist ".env" copy /y ".env" ".env.backup" > nul

echo.
echo 3. Aplicando nuevos archivos...
xcopy /s /y /i ".\\${extractDirName}\\*" "."

echo.
echo 4. Restaurando configuracion...
if exist ".env.backup" (
    copy /y ".env.backup" ".env" > nul
    del ".env.backup"
)

echo.
echo 5. Limpiando archivos temporales...
rmdir /s /q ".\\${extractDirName}"
if exist "${zipFileName}" del "${zipFileName}"

echo.
echo 6. Actualizando dependencias (si es necesario)...
call npm install --production

echo.
echo 7. Reiniciando sistema...
start "" "INICIAR-MECANET.bat"

echo.
echo [OK] Actualizacion completada.
echo Esta ventana se cerrara automaticamente.
timeout /t 2 /nobreak > nul

(goto) 2>nul & del "%~f0"
`;

    fs.writeFileSync(batPath, batContent);
    console.log('✅ Script de actualización (update.bat) generado.');
  }

  /**
   * Ejecuta el script y cierra el proceso actual
   */
  executeUpdateScript() {
    console.log('🚀 Ejecutando script de actualización y cerrando servidor...');
    
    const batPath = path.join(rootDir, 'update.bat');
    
    const subprocess = spawn('cmd.exe', ['/c', batPath], {
      detached: true,
      stdio: 'ignore',
      cwd: rootDir
    });

    subprocess.unref();
    process.exit(0);
  }
}

export default new UpdaterService();
