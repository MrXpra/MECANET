/**
 * DB.JS - Configuración de conexión a MongoDB
 * 
 * Este archivo exporta una función que establece la conexión
 * con la base de datos MongoDB usando Mongoose.
 * 
 * Variables requeridas en .env:
 * - MONGODB_URI: String de conexión a MongoDB Atlas o local
 */

import mongoose from 'mongoose';

/**
 * Función asíncrona que conecta a MongoDB
 * Si la conexión falla, termina el proceso con código de error
 */
const connectDB = async () => {
  try {
    // Conectar usando la URI del archivo .env
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // Mostrar el host al que nos conectamos (útil para debugging)
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    // Si hay error, mostrarlo y terminar el proceso
    console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
    // No salimos directamente aquí para permitir que server.js maneje la espera
    // process.exit(1); 
    throw error;
  }
};

export default connectDB;
