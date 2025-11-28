import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

// Cargar variables de entorno
dotenv.config();

const createCustomUsers = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('✅ Conectado a la base de datos');

    // 1. Crear/Actualizar Admin
    const adminData = {
      name: 'Administrador',
      email: 'admin@admin.com',
      password: '123456',
      role: 'admin',
      isActive: true
    };

    let admin = await User.findOne({ email: adminData.email });
    if (admin) {
      console.log(`⚠️  El usuario ${adminData.email} ya existe. Actualizando...`);
      admin.name = adminData.name;
      admin.password = adminData.password; // El middleware se encargará del hash si el modelo está configurado correctamente
      admin.role = adminData.role;
      admin.isActive = adminData.isActive;
      await admin.save();
      console.log('✅ Usuario Admin actualizado');
    } else {
      await User.create(adminData);
      console.log('✅ Usuario Admin creado');
    }

    // 2. Crear/Actualizar Developer
    const devData = {
      name: 'Edgar Padilla',
      email: 'sredgarpadilla@gmail.com',
      password: 'devpadilla',
      role: 'desarrollador',
      isActive: true
    };

    let dev = await User.findOne({ email: devData.email });
    if (dev) {
      console.log(`⚠️  El usuario ${devData.email} ya existe. Actualizando...`);
      dev.name = devData.name;
      dev.password = devData.password;
      dev.role = devData.role;
      dev.isActive = devData.isActive;
      await dev.save();
      console.log('✅ Usuario Developer actualizado');
    } else {
      await User.create(devData);
      console.log('✅ Usuario Developer creado');
    }

    console.log('\n🎉 Usuarios creados/actualizados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createCustomUsers();
