/**
 * CREATE ADMIN - Script para crear únicamente el usuario administrador
 * 
 * Este script limpia la base de datos y crea un usuario admin básico
 * Uso: npm run create-admin
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import connectDB from '../config/db.js';

// Cargar variables de entorno
dotenv.config();

const createAdmin = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    console.log('🗑️  Limpiando base de datos...');
    
    // Eliminar todas las colecciones existentes
    await User.deleteMany({});
    await Settings.deleteMany({});
    
    console.log('✅ Base de datos limpiada');
    
    // Crear usuario administrador
    // Nota: NO hasheamos manualmente, el middleware pre('save') del modelo lo hace automáticamente
    const admin = await User.create({
      name: 'Administrador',
      email: 'admin@mecanet.com',
      password: 'Admin123!', // Contraseña en texto plano, será hasheada por el middleware
      role: 'admin',
      isActive: true
    });
    
    console.log('✅ Usuario administrador creado');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Credenciales de acceso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Email: admin@mecanet.com');
    console.log('🔑 Contraseña: Admin123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('');
    
    // Crear configuración inicial básica
    await Settings.create({
      businessName: 'Mi Negocio',
      businessAddress: '',
      businessPhone: '',
      taxId: '',
      currency: 'USD',
      taxRate: 0,
      receiptFooter: 'Gracias por su compra',
      lowStockThreshold: 10
    });
    
    console.log('✅ Configuración inicial creada');
    console.log('🎉 Sistema listo para usar');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
