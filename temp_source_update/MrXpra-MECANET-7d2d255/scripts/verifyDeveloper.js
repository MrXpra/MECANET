/**
 * Script para verificar y actualizar el usuario desarrollador
 */

import User from '../models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const verifyDeveloper = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Conectado a MongoDB');

    // Buscar usuario desarrollador
    const developer = await User.findOne({ email: 'developer@sgtm.com' });

    if (!developer) {
      console.log('❌ Usuario desarrollador no encontrado');
      console.log('Creando usuario desarrollador...');
      
      const newDeveloper = await User.create({
        name: 'Desarrollador',
        email: 'developer@sgtm.com',
        password: 'developer123',
        role: 'desarrollador',
        isActive: true,
        shortcutsEnabled: true
      });

      console.log('✅ Usuario desarrollador creado:', {
        _id: newDeveloper._id,
        name: newDeveloper.name,
        email: newDeveloper.email,
        role: newDeveloper.role
      });
    } else {
      console.log('✅ Usuario desarrollador encontrado:', {
        _id: developer._id,
        name: developer.name,
        email: developer.email,
        role: developer.role,
        isActive: developer.isActive
      });

      // Verificar que tenga el rol correcto
      if (developer.role !== 'desarrollador') {
        console.log('⚠️ Corrigiendo rol a "desarrollador"...');
        developer.role = 'desarrollador';
        await developer.save();
        console.log('✅ Rol actualizado');
      }

      // Verificar que esté activo
      if (!developer.isActive) {
        console.log('⚠️ Activando usuario...');
        developer.isActive = true;
        await developer.save();
        console.log('✅ Usuario activado');
      }
    }

    console.log('\n📋 Instrucciones:');
    console.log('1. Cierra sesión en la aplicación');
    console.log('2. Abre DevTools (F12) → Application → Local Storage');
    console.log('3. Elimina todo el Local Storage');
    console.log('4. Inicia sesión con: developer@sgtm.com / developer123');
    console.log('5. Verifica que veas la sección "Sistema" en el menú');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
};

verifyDeveloper();
