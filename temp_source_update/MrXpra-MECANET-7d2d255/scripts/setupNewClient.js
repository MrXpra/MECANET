import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Sale from '../models/Sale.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Return from '../models/Return.js';
import CashierSession from '../models/CashierSession.js';
import CashWithdrawal from '../models/CashWithdrawal.js';
import AuditLog from '../models/AuditLog.js';
import Log from '../models/Log.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Script de inicialización para un nuevo cliente
 * 
 * Este script:
 * 1. Limpia completamente la base de datos
 * 2. Crea todas las colecciones necesarias
 * 3. Crea un usuario administrador
 * 4. Configura ajustes iniciales del sistema
 * 
 * USO: node scripts/setupNewClient.js
 */

const setupNewClient = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     🚀 CONFIGURACIÓN DE NUEVO CLIENTE - MECANET  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Conectar a MongoDB
    console.log('📡 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a:', process.env.MONGODB_URI.split('@')[1]?.split('/')[0] || 'MongoDB');
    console.log('');

    // ADVERTENCIA
    console.log('⚠️  ADVERTENCIA: Este proceso eliminará TODOS los datos existentes.');
    console.log('    Solo continúa si estás configurando un nuevo cliente.\n');
    
    const confirmClean = await question('¿Deseas continuar? (escribe "SI" para confirmar): ');
    
    if (confirmClean.toUpperCase() !== 'SI') {
      console.log('❌ Operación cancelada por el usuario.');
      process.exit(0);
    }

    console.log('');

    // ========================================
    // PASO 1: LIMPIAR BASE DE DATOS
    // ========================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  PASO 1: LIMPIANDO BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════════════\n');

    const collections = await mongoose.connection.db.collections();
    let deletedCount = 0;

    for (let collection of collections) {
      const result = await collection.deleteMany({});
      console.log(`  🗑️  ${collection.collectionName.padEnd(20)} - ${result.deletedCount} documentos eliminados`);
      deletedCount += result.deletedCount;
    }

    console.log(`\n✅ Total eliminados: ${deletedCount} documentos\n`);

    // ========================================
    // PASO 2: RECOPILAR DATOS DEL CLIENTE
    // ========================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  PASO 2: DATOS DEL NUEVO CLIENTE');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Datos del administrador
    console.log('📋 USUARIO ADMINISTRADOR:\n');
    const adminName = await question('  Nombre completo del administrador: ');
    const adminEmail = await question('  Email del administrador: ');
    let adminPassword = await question('  Contraseña (min 6 caracteres): ');
    
    while (adminPassword.length < 6) {
      console.log('  ⚠️  La contraseña debe tener al menos 6 caracteres');
      adminPassword = await question('  Contraseña (min 6 caracteres): ');
    }

    console.log('\n📋 DATOS DEL NEGOCIO:\n');
    const businessName = await question('  Nombre del negocio: ');
    const businessPhone = await question('  Teléfono del negocio (opcional): ') || '';
    const businessAddress = await question('  Dirección del negocio (opcional): ') || '';
    const businessEmail = await question('  Email del negocio (opcional): ') || adminEmail;

    console.log('\n📋 CONFIGURACIÓN REGIONAL:\n');
    const currency = await question('  Moneda (ej: USD, MXN, EUR) [USD]: ') || 'USD';
    const taxRate = await question('  Tasa de impuesto en % (ej: 16) [16]: ') || '16';
    const timezone = await question('  Zona horaria (ej: America/Mexico_City) [America/New_York]: ') || 'America/New_York';

    console.log('');

    // ========================================
    // PASO 3: CREAR USUARIO ADMINISTRADOR
    // ========================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  PASO 3: CREANDO USUARIO ADMINISTRADOR');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Crear usuario (el modelo User hasheará la contraseña automáticamente)
    const adminUser = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin'
    });

    console.log('✅ Usuario administrador creado exitosamente');
    console.log(`   ID: ${adminUser._id}`);
    console.log(`   Nombre: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Rol: ${adminUser.role}\n`);

    // ========================================
    // PASO 4: CONFIGURACIÓN INICIAL DEL SISTEMA
    // ========================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  PASO 4: CONFIGURANDO SISTEMA');
    console.log('═══════════════════════════════════════════════════════════\n');

    const settings = await Settings.create({
      businessName: businessName,
      businessPhone: businessPhone,
      businessAddress: businessAddress,
      businessEmail: businessEmail,
      taxRate: parseFloat(taxRate),
      currency: currency,
      timezone: timezone,
      language: 'es',
      dateFormat: 'DD/MM/YYYY',
      receiptPrefix: 'INV',
      lowStockThreshold: 10,
      enableNotifications: true,
      enableEmailNotifications: false,
      theme: 'light'
    });

    console.log('✅ Configuración del sistema creada');
    console.log(`   Negocio: ${settings.businessName}`);
    console.log(`   Moneda: ${settings.currency}`);
    console.log(`   Tasa de impuesto: ${settings.taxRate}%`);
    console.log(`   Zona horaria: ${settings.timezone}\n`);

    // ========================================
    // PASO 5: CREAR COLECCIONES VACÍAS
    // ========================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  PASO 5: INICIALIZANDO COLECCIONES');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Crear índices y asegurar que existan las colecciones
    const models = [
      { name: 'Products', model: Product },
      { name: 'Customers', model: Customer },
      { name: 'Suppliers', model: Supplier },
      { name: 'Sales', model: Sale },
      { name: 'PurchaseOrders', model: PurchaseOrder },
      { name: 'Returns', model: Return },
      { name: 'CashierSessions', model: CashierSession },
      { name: 'CashWithdrawals', model: CashWithdrawal },
      { name: 'AuditLogs', model: AuditLog },
      { name: 'Logs', model: Log }
    ];

    for (let { name, model } of models) {
      await model.createCollection();
      await model.createIndexes();
      console.log(`  ✅ ${name.padEnd(20)} - Colección creada e indexada`);
    }

    console.log('');

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📊 RESUMEN DE LA CONFIGURACIÓN:\n');
    console.log('  Base de Datos:');
    console.log(`    • Colecciones creadas: ${models.length + 2}`);
    console.log(`    • Índices configurados: ✅`);
    console.log('');
    console.log('  Usuario Administrador:');
    console.log(`    • Email: ${adminUser.email}`);
    console.log(`    • Contraseña: [configurada]`);
    console.log(`    • Rol: ${adminUser.role}`);
    console.log('');
    console.log('  Negocio:');
    console.log(`    • Nombre: ${settings.businessName}`);
    console.log(`    • Moneda: ${settings.currency}`);
    console.log(`    • Impuesto: ${settings.taxRate}%`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📝 PRÓXIMOS PASOS:\n');
    console.log('  1. Inicia el servidor: npm run dev');
    console.log('  2. Accede con las credenciales del administrador');
    console.log('  3. Configura los datos del negocio desde el panel');
    console.log('  4. Agrega productos, clientes y proveedores\n');

    console.log('🚀 El sistema está listo para usar!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error.message);
    console.error('\n📋 Detalles del error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Ejecutar el script
setupNewClient();
