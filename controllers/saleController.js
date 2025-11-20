import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import CashierSession from '../models/CashierSession.js';
import LogService from '../services/logService.js';
import AuditLogService from '../services/auditLogService.js';
import mongoose from 'mongoose';

// @desc    Crear nueva venta
// @route   POST /api/sales
// @access  Private
export const createSale = async (req, res) => {
  try {
    const { items, paymentMethod, customer, notes, globalDiscount = 0, globalDiscountAmount = 0 } = req.body;

    // Validar que hay items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Debe haber al menos un producto en la venta' });
    }

    // Verificar stock y calcular totales
    let subtotal = 0;
    let totalDiscount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ message: `Producto con ID ${item.product} no encontrado` });
      }

      // Verificar stock disponible
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` 
        });
      }

      // Calcular precio con descuento del producto
      const priceWithDiscount = product.sellingPrice * (1 - product.discountPercentage / 100);
      
      // Aplicar descuento adicional si se proporciona
      const additionalDiscount = item.discountApplied || 0;
      const finalPrice = priceWithDiscount * (1 - additionalDiscount / 100);
      
      const itemSubtotal = finalPrice * item.quantity;
      const itemDiscount = (product.sellingPrice * item.quantity) - itemSubtotal;

      subtotal += product.sellingPrice * item.quantity;
      totalDiscount += itemDiscount;

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        priceAtSale: product.sellingPrice,
        purchasePriceAtSale: product.purchasePrice || 0, // Guardar costo para calcular beneficio
        discountApplied: product.discountPercentage + additionalDiscount,
        subtotal: itemSubtotal
      });

      // Actualizar stock y soldCount del producto
      product.stock -= item.quantity;
      product.soldCount = (product.soldCount || 0) + item.quantity;
      await product.save();
    }

    // Aplicar descuento global
    const subtotalAfterItemDiscounts = subtotal - totalDiscount;
    // Si se proporciona el monto exacto del descuento, usar ese; si no, calcular desde el porcentaje
    const finalGlobalDiscountAmount = globalDiscountAmount > 0 
      ? globalDiscountAmount 
      : (globalDiscount / 100) * subtotalAfterItemDiscounts;
    totalDiscount += finalGlobalDiscountAmount;

    const total = subtotal - totalDiscount;

    // Generar número de factura
    const invoiceNumber = await Sale.generateInvoiceNumber();

    // Crear venta
    const sale = await Sale.create({
      invoiceNumber,
      user: req.user._id,
      customer: customer || null,
      items: processedItems,
      subtotal,
      totalDiscount,
      total,
      paymentMethod,
      notes
    });

    // Si hay cliente, actualizar su historial
    if (customer) {
      await Customer.findByIdAndUpdate(customer, {
        $push: { purchaseHistory: sale._id },
        $inc: { totalPurchases: total }
      });
    }

    // Poblar información de la venta
    const populatedSale = await Sale.findById(sale._id)
      .populate('user', 'name email')
      .populate('customer', 'fullName phone email')
      .populate('items.product', 'name sku');

    // Log técnico del sistema
    await LogService.logAction({
      action: 'create',
      module: 'sales',
      user: req.user,
      req,
      entityId: sale._id.toString(),
      entityName: sale.invoiceNumber,
      details: {
        invoiceNumber: sale.invoiceNumber,
        total: sale.total,
        itemsCount: sale.items.length,
        paymentMethod: sale.paymentMethod,
        customer: customer ? customer.fullName : 'Cliente General'
      },
      success: true
    });

    // Log de auditoría de usuario
    const customerInfo = customer ? await Customer.findById(customer) : null;
    await AuditLogService.logSale({
      user: req.user,
      action: 'Creación de Venta',
      saleId: sale._id.toString(),
      saleNumber: sale.invoiceNumber,
      description: `Se creó la factura #${sale.invoiceNumber} por un monto de RD$${total.toFixed(2)}${customerInfo ? ` para el cliente ${customerInfo.fullName}` : ''}`,
      amount: total,
      customer: customerInfo?.fullName,
      metadata: {
        itemsCount: sale.items.length,
        paymentMethod: sale.paymentMethod,
        discount: totalDiscount
      },
      req
    });

    res.status(201).json(populatedSale);
  } catch (error) {
    console.error('Error al crear venta:', error);
    
    // Log de error
    await LogService.logError({
      module: 'sales',
      action: 'create',
      message: `Error al crear venta: ${error.message}`,
      error,
      user: req.user,
      req,
      details: { itemsCount: req.body.items?.length }
    });
    
    res.status(500).json({ message: 'Error al crear venta', error: error.message });
  }
};

// @desc    Obtener todas las ventas (con paginación)
// @route   GET /api/sales
// @access  Private
export const getSales = async (req, res) => {
  try {
    const { startDate, endDate, user, paymentMethod, status, search, page = 1, limit = 50 } = req.query;
    
    let query = {};

    // Filtro por búsqueda de número de factura
    if (search) {
      // Limpiar espacios y caracteres especiales del search
      const cleanSearch = search.trim().replace(/[\s-]/g, '');
      // Buscar exactamente o que contenga el término (más flexible)
      query.$or = [
        { invoiceNumber: { $regex: cleanSearch, $options: 'i' } },
        { invoiceNumber: cleanSearch.toUpperCase() }
      ];
    }

    // Filtro por rango de fechas
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00.000');
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59.999');
        query.createdAt.$lte = end;
      }
    }

    // Filtro por usuario (cajero)
    if (user) {
      query.user = user;
    }

    // Filtro por método de pago
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Filtro por estado
    if (status) {
      query.status = status;
    }

    // Calcular skip y limit para paginación
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Contar total de documentos que coinciden con el query
    const totalDocs = await Sale.countDocuments(query);

    // Calcular estadísticas globales (sin paginación)
    const allSales = await Sale.find(query).select('status total').lean();
    const stats = {
      total: allSales.length,
      completed: allSales.filter(s => s.status === 'Completada').length,
      cancelled: allSales.filter(s => s.status === 'Cancelada').length,
      totalAmount: allSales.filter(s => s.status === 'Completada').reduce((sum, s) => sum + (s.total || 0), 0)
    };

    // Obtener ventas con paginación
    const sales = await Sale.find(query)
      .populate('user', 'name email')
      .populate('customer', 'fullName phone')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(); // usar lean() para mejorar performance

    // Obtener información de devoluciones para cada venta (en paralelo)
    const Return = mongoose.model('Return');
    const saleIds = sales.map(s => s._id);
    const allReturns = await Return.find({ sale: { $in: saleIds } })
      .select('sale returnNumber status totalAmount createdAt items')
      .lean();

    // Agrupar returns por sale
    const returnsBySale = {};
    allReturns.forEach(ret => {
      const saleId = ret.sale.toString();
      if (!returnsBySale[saleId]) returnsBySale[saleId] = [];
      returnsBySale[saleId].push(ret);
    });

    // Agregar info de returns a cada sale
    const salesWithReturns = sales.map(sale => {
      const returns = returnsBySale[sale._id.toString()] || [];
      return {
        ...sale,
        returns,
        hasReturns: returns.length > 0,
        returnsCount: returns.length,
        totalReturned: returns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0)
      };
    });

    res.json({
      sales: salesWithReturns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalDocs,
        pages: Math.ceil(totalDocs / limitNum),
        hasNextPage: pageNum < Math.ceil(totalDocs / limitNum),
        hasPrevPage: pageNum > 1
      },
      stats
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
  }
};

// @desc    Obtener una venta por ID
// @route   GET /api/sales/:id
// @access  Private
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('user', 'name email')
      .populate('customer', 'fullName phone email address')
      .populate('items.product', 'name sku brand');

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Obtener devoluciones previas de esta venta para calcular cantidades disponibles
    const Return = mongoose.model('Return');
    const previousReturns = await Return.find({ 
      sale: req.params.id,
      status: { $ne: 'Rechazada' } // Contar todas excepto rechazadas
    });

    // Calcular cantidades ya devueltas por producto
    const returnedQuantities = {};
    for (const prevReturn of previousReturns) {
      for (const prevItem of prevReturn.items) {
        const prodId = prevItem.product.toString();
        returnedQuantities[prodId] = (returnedQuantities[prodId] || 0) + prevItem.quantity;
      }
    }

    // Agregar información de cantidades disponibles a cada item
    const saleObj = sale.toObject();
    saleObj.items = saleObj.items.map(item => {
      const productId = typeof item.product === 'object' ? item.product._id.toString() : item.product.toString();
      const alreadyReturned = returnedQuantities[productId] || 0;
      return {
        ...item,
        returnedQuantity: alreadyReturned,
        availableToReturn: item.quantity - alreadyReturned
      };
    });

    res.json(saleObj);
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ message: 'Error al obtener venta', error: error.message });
  }
};

// @desc    Obtener ventas del usuario actual (para cierre de caja)
// @route   GET /api/sales/user/me
// @access  Private
export const getMySales = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sales = await Sale.find({
      user: req.user._id,
      createdAt: { $gte: today },
      status: 'Completada'
    })
      .populate('customer', 'fullName phone email')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    // Calcular totales por método de pago
    const summary = {
      totalSales: sales.length,
      totalAmount: 0,
      byPaymentMethod: {
        Efectivo: 0,
        Tarjeta: 0,
        Transferencia: 0
      }
    };

    sales.forEach(sale => {
      summary.totalAmount += sale.total;
      summary.byPaymentMethod[sale.paymentMethod] += sale.total;
    });

    res.json({
      sales,
      summary
    });
  } catch (error) {
    console.error('Error al obtener ventas del usuario:', error);
    res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
  }
};

// @desc    Cancelar venta
// @route   PUT /api/sales/:id/cancel
// @access  Private/Admin
export const cancelSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('items.product');

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    if (sale.status === 'Cancelada') {
      return res.status(400).json({ message: 'La venta ya está cancelada' });
    }

    // Restaurar stock de los productos (solo si el producto aún existe)
    let restoredCount = 0;
    let skippedCount = 0;
    
    for (const item of sale.items) {
      // Verificar que el producto existe antes de actualizar
      const productId = item.product?._id || item.product;
      
      if (productId) {
        const productExists = await Product.findById(productId);
        
        if (productExists) {
          await Product.findByIdAndUpdate(productId, {
            $inc: { stock: item.quantity }
          });
          restoredCount++;
        } else {
          console.warn(`⚠️ Producto ${productId} no existe. No se puede restaurar stock.`);
          skippedCount++;
        }
      } else {
        console.warn(`⚠️ Item sin producto válido en venta ${sale._id}`);
        skippedCount++;
      }
    }

    sale.status = 'Cancelada';
    await sale.save();

    console.log(`✅ Venta cancelada. Stock restaurado: ${restoredCount}, Productos no disponibles: ${skippedCount}`);

    // Actualizar historial del cliente si existe
    if (sale.customer) {
      await Customer.findByIdAndUpdate(sale.customer, {
        $inc: { totalPurchases: -sale.total }
      });
    }

    // Log técnico del sistema
    await LogService.logAction({
      action: 'cancel',
      module: 'sales',
      user: req.user,
      req,
      entityId: sale._id.toString(),
      entityName: sale.invoiceNumber,
      details: {
        invoiceNumber: sale.invoiceNumber,
        total: sale.total,
        restoredCount,
        skippedCount,
        reason: req.body.reason || 'No especificado'
      },
      success: true
    });

    // Log de auditoría de usuario
    await AuditLogService.logSale({
      user: req.user,
      action: 'Anulación de Venta',
      saleId: sale._id.toString(),
      saleNumber: sale.invoiceNumber,
      description: `Se anuló la factura #${sale.invoiceNumber} por un monto de RD$${sale.total.toFixed(2)}. ${req.body.reason ? `Motivo: ${req.body.reason}` : ''}`,
      amount: sale.total,
      metadata: {
        itemsRestored: restoredCount,
        itemsSkipped: skippedCount,
        reason: req.body.reason || 'No especificado'
      },
      req
    });

    res.json({ message: 'Venta cancelada exitosamente', sale });
  } catch (error) {
    console.error('Error al cancelar venta:', error);
    
    // Log de error
    await LogService.logError({
      module: 'sales',
      action: 'cancel',
      message: `Error al cancelar venta: ${error.message}`,
      error,
      user: req.user,
      req,
      details: { saleId: req.params.id }
    });
    
    res.status(500).json({ message: 'Error al cancelar venta', error: error.message });
  }
};

// @desc    Cerrar caja / Finalizar turno del cajero
// @route   POST /api/sales/close-register
// @access  Private
export const closeCashRegister = async (req, res) => {
  try {
    const { countedTotals, notes } = req.body;
    const cashierId = req.user._id;

    // Validar datos requeridos
    if (!countedTotals || !countedTotals.cash === undefined || !countedTotals.card === undefined || !countedTotals.transfer === undefined) {
      return res.status(400).json({ message: 'Debe proporcionar los totales contados (efectivo, tarjeta, transferencia)' });
    }

    // Obtener ventas del cajero del día actual (desde las 00:00:00 hasta ahora)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const now = new Date();

    const sales = await Sale.find({
      cashier: cashierId,
      createdAt: { 
        $gte: startOfDay,
        $lte: now
      },
      status: { $ne: 'Cancelada' }
    });

    // Obtener retiros de caja del día actual
    const CashWithdrawal = mongoose.model('CashWithdrawal');
    const withdrawals = await CashWithdrawal.find({
      withdrawnBy: cashierId,
      createdAt: {
        $gte: startOfDay,
        $lte: now
      },
      status: 'Aprobado'
    });

    // Calcular total de retiros
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Calcular totales del sistema
    const systemTotals = {
      totalSales: sales.length,
      totalAmount: 0,
      cash: 0,
      card: 0,
      transfer: 0
    };

    sales.forEach(sale => {
      systemTotals.totalAmount += sale.total;
      
      if (sale.paymentMethod === 'Efectivo') {
        systemTotals.cash += sale.total;
      } else if (sale.paymentMethod === 'Tarjeta') {
        systemTotals.card += sale.total;
      } else if (sale.paymentMethod === 'Transferencia') {
        systemTotals.transfer += sale.total;
      }
    });

    // Restar retiros del efectivo esperado
    systemTotals.cash -= totalWithdrawals;

    // Calcular diferencias
    const differences = {
      cash: countedTotals.cash - systemTotals.cash,
      card: countedTotals.card - systemTotals.card,
      transfer: countedTotals.transfer - systemTotals.transfer,
      total: (countedTotals.cash + countedTotals.card + countedTotals.transfer) - systemTotals.totalAmount
    };

    // Crear registro de sesión de caja
    const session = await CashierSession.create({
      cashier: cashierId,
      openedAt: startOfDay,
      closedAt: now,
      systemTotals,
      countedTotals,
      differences,
      notes: notes || '',
      sales: sales.map(s => s._id),
      totalWithdrawals,
      withdrawals: withdrawals.map(w => w._id)
    });

    // Poblar datos del cajero para la respuesta
    await session.populate('cashier', 'fullName email');

    res.status(201).json({
      message: 'Cierre de caja realizado exitosamente',
      session,
      summary: {
        systemTotals,
        countedTotals,
        differences
      }
    });

  } catch (error) {
    console.error('Error al cerrar caja:', error);
    res.status(500).json({ message: 'Error al cerrar caja', error: error.message });
  }
};
