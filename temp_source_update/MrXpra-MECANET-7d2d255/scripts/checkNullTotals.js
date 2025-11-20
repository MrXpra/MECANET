#!/usr/bin/env node
import mongoose from 'mongoose';
const MONGODB_URI = 'mongodb+srv://TEST_USER:vWHPZ0VKzSDXdsSp@cluster0.fmycxxx.mongodb.net/PRUEBA';
await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;
const count = await db.collection('sales').countDocuments({
  $or: [
    { total: null },
    { total: { $exists: false } },
    { total: NaN }
  ]
});
console.log('Ventas con total inválido:', count);

// Calcular total desde items para ventas sin total
const sales = await db.collection('sales').find({
  $or: [{ total: null }, { total: { $exists: false } }]
}).limit(10).toArray();

console.log('\nEjemplos de ventas sin total:');
for (const sale of sales) {
  const itemsTotal = sale.items?.reduce((sum, item) => sum + (item.lineTotal || 0), 0) || 0;
  console.log(`${sale.invoiceNumber}: items total = ${itemsTotal}`);
}

await mongoose.disconnect();
