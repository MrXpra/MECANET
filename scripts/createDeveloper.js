/**
 * Script para crear un usuario con rol desarrollador
 * Uso: node scripts/createDeveloper.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Cargar variables de entorno
dotenv.config();

const createDeveloper = async () => {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://TEST_USER:vWHPZ0VKzSDXdsSp@cluster0.fmycxxx.mongodb.net/PRUEBA?appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe
    const existingDev = await User.findOne({ email: 'developer@sgtm.com' });
    
    if (existingDev) {
      console.log('⚠️  Ya existe un usuario con email developer@sgtm.com');
      console.log('Actualizando rol a desarrollador...');
      existingDev.role = 'desarrollador';
      await existingDev.save();
      console.log('✅ Usuario actualizado a desarrollador');
    } else {
      // Crear nuevo usuario desarrollador
      const developer = await User.create({
        name: 'Developer',
        email: 'developer@sgtm.com',
        password: 'developer123', // Se hasheará automáticamente por el middleware pre-save
        role: 'desarrollador',
        isActive: true
      });

      console.log('✅ Usuario desarrollador creado exitosamente');
      console.log('📧 Email: developer@sgtm.com');
      console.log('🔑 Password: developer123');
      console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createDeveloper();
