/**
 * VERIFY USER - Script para verificar usuario en la base de datos
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const verifyUser = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Buscando usuario: admin@admin.com');
    
    const user = await User.findOne({ email: 'admin@admin.com' }).select('+password');
    
    if (!user) {
      console.log('❌ Usuario NO encontrado en la base de datos');
      console.log('\n📋 Usuarios existentes:');
      const allUsers = await User.find({}, 'email name role');
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name}) - Rol: ${u.role}`);
      });
    } else {
      console.log('✅ Usuario encontrado:');
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Nombre: ${user.name}`);
      console.log(`  - Rol: ${user.role}`);
      console.log(`  - Activo: ${user.isActive}`);
      console.log(`  - Password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'No definido'}`);
      
      // Verificar contraseña
      const testPassword = '123456';
      const isMatch = await bcrypt.compare(testPassword, user.password);
      
      console.log('\n🔐 Verificación de contraseña:');
      console.log(`  - Contraseña probada: "${testPassword}"`);
      console.log(`  - ¿Coincide?: ${isMatch ? '✅ SÍ' : '❌ NO'}`);
      
      if (!isMatch) {
        console.log('\n⚠️  La contraseña "123456" NO coincide con el hash almacenado');
        console.log('💡 Voy a crear un nuevo hash para verificar:');
        const newHash = await bcrypt.hash('123456', 10);
        console.log(`   Nuevo hash generado: ${newHash.substring(0, 30)}...`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verifyUser();
