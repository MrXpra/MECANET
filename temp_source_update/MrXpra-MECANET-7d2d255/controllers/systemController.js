import UpdaterService from '../services/updaterService.js';

/**
 * @desc    Verificar si hay actualizaciones disponibles
 * @route   GET /api/system/check-update
 * @access  Private/Admin
 */
export const checkUpdate = async (req, res) => {
  try {
    const result = await UpdaterService.checkForUpdates();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al buscar actualizaciones', 
      error: error.message 
    });
  }
};

/**
 * @desc    Descargar y aplicar actualización
 * @route   POST /api/system/update
 * @access  Private/Admin
 */
export const performUpdate = async (req, res) => {
  try {
    const { downloadUrl } = req.body;
    
    if (!downloadUrl) {
      // Si no se provee URL, buscar la última automáticamente
      const check = await UpdaterService.checkForUpdates();
      if (!check.hasUpdate) {
        return res.status(400).json({ message: 'No hay actualizaciones disponibles.' });
      }
      
      // Iniciar proceso con la URL encontrada
      UpdaterService.downloadAndApplyUpdate(check.downloadUrl);
      
      // Responder antes de que el servidor se cierre
      return res.json({ 
        message: 'Actualización iniciada. El servidor se reiniciará en unos momentos.',
        version: check.version
      });
    }

    // Iniciar proceso con URL específica
    UpdaterService.downloadAndApplyUpdate(downloadUrl);
    
    res.json({ 
      message: 'Actualización iniciada. El servidor se reiniciará en unos momentos.' 
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al iniciar actualización', 
      error: error.message 
    });
  }
};
