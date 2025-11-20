/**
 * @file proxyRoutes.js
 * @description Rutas proxy para servicios externos (evitar CORS y proteger API keys)
 * 
 * Endpoints:
 * - GET /api/proxy/image - Cargar imágenes externas (evita CORS)
 * 
 * Middleware:
 * - Sin autenticación (público)
 * 
 * Query Params:
 * - GET /image: url (URL de la imagen a cargar)
 * 
 * Propósito:
 * - Permite al frontend cargar imágenes de URLs externas sin problemas de CORS
 * - Valida que la URL sea válida y apunte a una imagen
 * - Añade headers de caché (1 día) para optimizar rendimiento
 * - Usa User-Agent para evitar bloqueos de algunos servidores
 * 
 * Seguridad:
 * - Valida formato de URL
 * - Verifica content-type sea image/*
 * - Maneja errores de fetch
 */

import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Proxy para cargar imágenes externas y evitar CORS
router.get('/image', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'URL es requerida' });
    }

    // Validar que sea una URL válida
    let imageUrl;
    try {
      imageUrl = new URL(url);
    } catch (error) {
      return res.status(400).json({ message: 'URL inválida' });
    }

    // Fetch de la imagen
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        message: `Error al cargar imagen: ${response.statusText}` 
      });
    }

    // Obtener el content-type
    const contentType = response.headers.get('content-type');
    
    // Verificar que sea una imagen
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ message: 'La URL no apunta a una imagen válida' });
    }

    // Obtener el buffer de la imagen
    const buffer = await response.buffer();

    // Enviar la imagen con los headers correctos
    res.set('Content-Type', contentType);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache por 1 día
    res.send(buffer);

  } catch (error) {
    console.error('Error en proxy de imagen:', error);
    res.status(500).json({ message: 'Error al procesar la imagen', error: error.message });
  }
});

export default router;
