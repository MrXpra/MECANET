import Return from '../models/Return.js';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import mongoose from 'mongoose';

// Obtener todas las devoluciones con filtros y paginación
export const getReturns = async (req, res) => {
  try {
    const { startDate, endDate, status, search, page = 1, limit = 50 } = req.query;

    let query = {};

    // Filtro por fecha
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    // Filtro por estado
    if (status) {
      query.status = status;
    }

    // Búsqueda por número de devolución o por código de factura
    if (search) {
      const cleanSearch = search.trim().replace(/[\s-]/g, '');

      // Buscar ventas que coincidan con el invoiceNumber
      const Sale = mongoose.model('Sale');
      const matchingSales = await Sale.find({
        $or: [
          { invoiceNumber: { $regex: cleanSearch, $options: 'i' } },
          { invoiceNumber: cleanSearch.toUpperCase() }
        ]
      }).select('_id').lean();

      const saleIds = matchingSales.map(s => s._id);

      // Buscar por returnNumber o por sale ID
      query.$or = [
        { returnNumber: { $regex: search, $options: 'i' } },
        { sale: { $in: saleIds } }
      ];
    }

    // Paginación
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Contar total
    const totalDocs = await Return.countDocuments(query);

    const returns = await Return.find(query)
      .populate('sale', 'invoiceNumber totalAmount')
      .populate('customer', 'fullName email phone')
      .populate('items.product', 'name sku warranty')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      returns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalDocs,
        pages: Math.ceil(totalDocs / limitNum),
        hasNextPage: pageNum < Math.ceil(totalDocs / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error al obtener devoluciones:', error);
    res.status(500).json({ message: 'Error al obtener devoluciones', error: error.message });
  }
};

// Obtener una devolución por ID
export const getReturnById = async (req, res) => {
  try {
    const returnDoc = await Return.findById(req.params.id)
      .populate('sale')
      .populate('customer')
      .populate('items.product')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!returnDoc) {
      return res.status(404).json({ message: 'Devolución no encontrada' });
    }

    res.json(returnDoc);
  } catch (error) {
    console.error('Error al obtener devolución:', error);
    res.status(500).json({ message: 'Error al obtener devolución', error: error.message });
  }
};

// Crear una nueva devolución
export const createReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { saleId, items, reason, notes, refundMethod, exchangeItems, priceDifference } = req.body;

    // Validar que la venta existe
    const sale = await Sale.findById(saleId).populate('items.product').session(session);
    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Validar que la venta no esté cancelada
    if (sale.status === 'Cancelada') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'No se puede devolver una venta cancelada' });
    }

    // Obtener devoluciones previas de esta venta (excluir solo las rechazadas)
    const previousReturns = await Return.find({
      sale: saleId,
      status: { $ne: 'Rechazada' } // Contar todas excepto rechazadas
    }).session(session);

    console.log('🔍 Previous returns found:', previousReturns.length);

    // Calcular cantidades ya devueltas por producto
    const returnedQuantities = {};
    for (const prevReturn of previousReturns) {
      console.log('📦 Processing return:', prevReturn.returnNumber, 'Status:', prevReturn.status);
      for (const prevItem of prevReturn.items) {
        const prodId = prevItem.product.toString();
        returnedQuantities[prodId] = (returnedQuantities[prodId] || 0) + prevItem.quantity;
        console.log('  - Product:', prodId, 'Quantity returned:', prevItem.quantity, 'Total so far:', returnedQuantities[prodId]);
      }
    }

    console.log('📊 Total returned quantities:', returnedQuantities);

    // Validar items de devolución
    const returnItems = [];
    let totalAmount = 0;

    for (const item of items) {
      // Buscar el producto en la venta original
      const saleItem = sale.items.find(
        si => {
          // Manejar caso donde product puede ser null, undefined, o un objeto
          if (!si.product) return false;

          const productId = typeof si.product === 'object'
            ? si.product._id
            : si.product;

          if (!productId) return false;

          return productId.toString() === item.productId.toString();
        }
      );

      if (!saleItem) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `El producto ${item.productId} no está en la venta original o ha sido eliminado del sistema`
        });
      }

      // Calcular cantidad disponible para devolver
      const alreadyReturned = returnedQuantities[item.productId.toString()] || 0;
      const availableToReturn = saleItem.quantity - alreadyReturned;

      console.log('🔢 Validation for product:', item.productId);
      console.log('  - Original quantity in sale:', saleItem.quantity);
      console.log('  - Already returned:', alreadyReturned);
      console.log('  - Available to return:', availableToReturn);
      console.log('  - Trying to return:', item.quantity);

      // Validar cantidad disponible
      if (item.quantity > availableToReturn) {
        await session.abortTransaction();
        const productName = saleItem.product?.name || 'este producto';
        console.log('❌ VALIDATION FAILED: Trying to return more than available');
        return res.status(400).json({
          message: `Solo puedes devolver ${availableToReturn} unidad(es) de ${productName}. Ya se devolvieron ${alreadyReturned} de ${saleItem.quantity} originales.`
        });
      }

      // Calcular monto de devolución (precio unitario * cantidad devuelta)
      const returnAmount = saleItem.priceAtSale * item.quantity;

      // Determinar si el producto es defectuoso
      const isDefective = reason.toLowerCase() === 'defectuoso';

      returnItems.push({
        product: item.productId,
        quantity: item.quantity,
        originalPrice: saleItem.priceAtSale,
        returnAmount: returnAmount,
        isDefective: isDefective,
      });

      totalAmount += returnAmount;

      // Devolver productos al inventario (solo si el producto existe)
      const productExists = await Product.findById(item.productId).session(session);

      if (productExists) {
        if (isDefective) {
          // Si es defectuoso, va a stock defectuoso
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { defectiveStock: item.quantity } },
            { session }
          );
        } else {
          // Si no es defectuoso, va a stock normal
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      } else {
        console.warn(`⚠️ Producto ${item.productId} no existe en la base de datos. No se puede devolver al inventario.`);
      }
    }

    // Procesar cambio si la razón es "Cambio"
    let exchangeData = null;
    if (reason === 'Cambio' && exchangeItems && exchangeItems.length > 0) {
      // Validar que los productos de cambio tengan stock
      for (const exchangeItem of exchangeItems) {
        const product = await Product.findById(exchangeItem.productId).session(session);
        if (!product) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Producto de cambio ${exchangeItem.productId} no encontrado`
          });
        }
        if (product.stock < exchangeItem.quantity) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `No hay suficiente stock de ${product.name}. Disponible: ${product.stock}`
          });
        }

        // Reducir el stock del producto de cambio
        await Product.findByIdAndUpdate(
          exchangeItem.productId,
          { $inc: { stock: -exchangeItem.quantity } },
          { session }
        );
      }

      // Guardar información del cambio
      exchangeData = {
        items: exchangeItems.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        priceDifference: priceDifference || 0,
      };

      // Si hay diferencia de precio positiva (cliente debe pagar), ajustar el refundMethod
      // Si hay diferencia negativa (se devuelve al cliente), mantener el refundMethod
    }

    // Crear la devolución
    const newReturn = new Return({
      sale: saleId,
      customer: sale.customer,
      items: returnItems,
      reason,
      notes,
      totalAmount,
      refundMethod: reason === 'Cambio' ? 'Cambio' : refundMethod,
      processedBy: req.user._id,
      status: 'Completada', // Auto-aprobar o cambiar según reglas de negocio
      exchangeItems: exchangeData ? exchangeData.items : undefined,
      priceDifference: exchangeData ? exchangeData.priceDifference : undefined,
    });

    await newReturn.save({ session });

    // Actualizar estado de la venta si es devolución total
    const totalSaleItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReturnItems = returnItems.reduce((sum, item) => sum + item.quantity, 0);

    if (totalSaleItems === totalReturnItems && reason !== 'Cambio') {
      sale.status = 'Devuelta';
      await sale.save({ session });
    }

    await session.commitTransaction();

    // Obtener la devolución completa con populate
    const populatedReturn = await Return.findById(newReturn._id)
      .populate('sale', 'invoiceNumber')
      .populate('customer', 'fullName email phone')
      .populate('items.product', 'name sku')
      .populate('processedBy', 'name email');

    res.status(201).json(populatedReturn);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error al crear devolución:', error);
    res.status(500).json({ message: 'Error al crear devolución', error: error.message });
  } finally {
    session.endSession();
  }
};

// Aprobar una devolución (requiere permiso de administrador)
export const approveReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const returnDoc = await Return.findById(req.params.id).session(session);

    if (!returnDoc) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Devolución no encontrada' });
    }

    if (returnDoc.status !== 'Pendiente') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Solo se pueden aprobar devoluciones pendientes' });
    }

    // Devolver productos al inventario
    for (const item of returnDoc.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    // Actualizar estado de la devolución
    returnDoc.status = 'Aprobada';
    returnDoc.approvedBy = req.user._id;
    await returnDoc.save({ session });

    await session.commitTransaction();

    const updatedReturn = await Return.findById(returnDoc._id)
      .populate('sale', 'invoiceNumber')
      .populate('customer', 'fullName email phone')
      .populate('items.product', 'name sku')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email');

    res.json(updatedReturn);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error al aprobar devolución:', error);
    res.status(500).json({ message: 'Error al aprobar devolución', error: error.message });
  } finally {
    session.endSession();
  }
};

// Rechazar una devolución
export const rejectReturn = async (req, res) => {
  try {
    const { notes } = req.body;

    const returnDoc = await Return.findById(req.params.id);

    if (!returnDoc) {
      return res.status(404).json({ message: 'Devolución no encontrada' });
    }

    if (returnDoc.status !== 'Pendiente') {
      return res.status(400).json({ message: 'Solo se pueden rechazar devoluciones pendientes' });
    }

    returnDoc.status = 'Rechazada';
    returnDoc.notes = notes || returnDoc.notes;
    returnDoc.approvedBy = req.user._id;
    await returnDoc.save();

    const updatedReturn = await Return.findById(returnDoc._id)
      .populate('sale', 'invoiceNumber')
      .populate('customer', 'fullName email phone')
      .populate('items.product', 'name sku')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email');

    res.json(updatedReturn);
  } catch (error) {
    console.error('Error al rechazar devolución:', error);
    res.status(500).json({ message: 'Error al rechazar devolución', error: error.message });
  }
};

// Obtener estadísticas de devoluciones
export const getReturnStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z'),
        },
      };
    }

    // Total de devoluciones
    const totalReturns = await Return.countDocuments(dateFilter);

    // Devoluciones por estado
    const returnsByStatus = await Return.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    // Devoluciones por razón
    const returnsByReason = await Return.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
        },
      },
    ]);

    // Productos más devueltos
    const topReturnedProducts = await Return.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalAmount: { $sum: '$items.returnAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
    ]);

    // Monto total devuelto
    const totalAmountReturned = await Return.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    res.json({
      totalReturns,
      returnsByStatus,
      returnsByReason,
      topReturnedProducts,
      totalAmountReturned: totalAmountReturned[0]?.total || 0,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de devoluciones:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
};
