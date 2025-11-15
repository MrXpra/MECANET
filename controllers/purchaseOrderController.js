import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import { sendPurchaseOrderEmail } from '../services/emailService.js';

// Obtener todas las órdenes de compra
export const getPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find()
      .populate('supplier', 'name email phone')
      .populate('items.product', 'sku name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ message: 'Error al obtener órdenes de compra' });
  }
};

// Obtener una orden por ID
export const getPurchaseOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('items.product')
      .populate('createdBy', 'name email');
    
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({ message: 'Error al obtener orden' });
  }
};

// Crear orden de compra
export const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier, genericSupplierName, items, notes, expectedDeliveryDate } = req.body;

    // Verificar que el proveedor existe (solo si se proporciona)
    if (supplier && supplier.trim() !== '') {
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }
    }

    // Calcular totales (solo si los items tienen precio)
    let subtotal = 0;
    let hasPrices = true;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Producto ${item.product} no encontrado` });
      }

      // Si no se proporciona precio, usar 0 y marcar que no hay precios
      const unitPrice = item.unitPrice !== undefined && item.unitPrice !== null && item.unitPrice !== '' 
        ? parseFloat(item.unitPrice) 
        : 0;
      
      if (unitPrice === 0) {
        hasPrices = false;
      }

      const itemSubtotal = item.quantity * unitPrice;
      subtotal += itemSubtotal;

      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        unitPrice: unitPrice,
        subtotal: itemSubtotal,
      });
    }

    // Solo calcular impuesto y total si hay precios definidos
    const tax = hasPrices ? subtotal * 0.18 : 0;
    const total = subtotal + tax;

    // Preparar datos de la orden
    const orderData = {
      items: processedItems,
      subtotal,
      tax,
      total,
      notes,
      expectedDeliveryDate,
      createdBy: req.user.id,
    };

    // Solo agregar supplier si se proporciona y no está vacío
    if (supplier && supplier.trim() !== '') {
      orderData.supplier = supplier;
    }

    // Agregar nombre de proveedor genérico si se proporciona
    if (genericSupplierName && genericSupplierName.trim() !== '') {
      orderData.genericSupplierName = genericSupplierName.trim();
    }

    const order = new PurchaseOrder(orderData);

    await order.save();
    
    // Populate para retornar datos completos
    await order.populate('supplier', 'name email phone');
    await order.populate('items.product', 'sku name');
    await order.populate('createdBy', 'name email');

    res.status(201).json(order);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ message: 'Error al crear orden de compra' });
  }
};

// Generar orden automática por productos con bajo stock
export const generateAutoOrder = async (req, res) => {
  try {
    const { supplierId, productIds } = req.body;

    let query = {};
    
    // Productos con stock menor o igual al threshold
    const allProducts = await Product.find().populate('supplier');
    let lowStockProducts = allProducts.filter(p => p.stock <= p.lowStockThreshold);
    
    if (supplierId) {
      lowStockProducts = lowStockProducts.filter(p => 
        p.supplier && p.supplier._id.toString() === supplierId
      );
    }
    
    if (productIds && productIds.length > 0) {
      lowStockProducts = lowStockProducts.filter(p => 
        productIds.includes(p._id.toString())
      );
    }

    if (lowStockProducts.length === 0) {
      return res.status(404).json({ message: 'No hay productos con stock bajo' });
    }

    // Filtrar productos que NO tengan proveedor
    const productsWithSupplier = lowStockProducts.filter(p => p.supplier && p.supplier._id);
    
    if (productsWithSupplier.length === 0) {
      return res.status(404).json({ 
        message: 'No hay productos con stock bajo que tengan proveedor asignado' 
      });
    }

    // Agrupar por proveedor
    const ordersBySupplier = {};

    for (const product of productsWithSupplier) {
      const supplierId = product.supplier._id.toString();
      
      if (!ordersBySupplier[supplierId]) {
        ordersBySupplier[supplierId] = {
          supplier: product.supplier,
          items: [],
        };
      }

      // Cantidad sugerida: el doble del threshold menos el stock actual
      const suggestedQuantity = Math.max((product.lowStockThreshold * 2) - product.stock, 1);

      ordersBySupplier[supplierId].items.push({
        product: product._id,
        quantity: suggestedQuantity,
        unitPrice: 0, // Sin precio, se define con el proveedor
        subtotal: 0,
      });
    }

    // Crear órdenes
    const createdOrders = [];

    for (const supplierId in ordersBySupplier) {
      const orderData = ordersBySupplier[supplierId];

      const order = new PurchaseOrder({
        supplier: supplierId,
        items: orderData.items,
        subtotal: 0,
        tax: 0,
        total: 0,
        notes: 'Orden generada automáticamente por stock bajo - Precios a confirmar con proveedor',
        createdBy: req.user.id,
      });

      await order.save();
      await order.populate('supplier', 'name email phone');
      await order.populate('items.product', 'sku name');
      
      createdOrders.push(order);
    }

    res.status(201).json({
      message: `${createdOrders.length} orden(es) creada(s) exitosamente`,
      orders: createdOrders,
    });
  } catch (error) {
    console.error('Error al generar órdenes automáticas:', error);
    res.status(500).json({ message: 'Error al generar órdenes automáticas' });
  }
};

// Actualizar orden completa (editar)
export const updatePurchaseOrder = async (req, res) => {
  try {
    const { supplier, items, notes, expectedDeliveryDate } = req.body;

    // Validar proveedor
    if (supplier) {
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }
    }

    // Validar y calcular items
    let processedItems = [];
    let subtotal = 0;

    if (items && items.length > 0) {
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Producto ${item.product} no encontrado` });
        }

        const itemSubtotal = item.quantity * item.unitPrice;
        subtotal += itemSubtotal;

        processedItems.push({
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: itemSubtotal,
        });
      }
    }

    // Calcular impuesto y total
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const updateData = {
      ...(supplier && { supplier }),
      ...(items && items.length > 0 && { items: processedItems, subtotal, tax, total }),
      ...(notes !== undefined && { notes }),
      ...(expectedDeliveryDate && { expectedDeliveryDate }),
    };

    const order = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('supplier', 'name email phone')
      .populate('items.product', 'sku name')
      .populate('createdBy', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ message: 'Error al actualizar orden de compra' });
  }
};

// Actualizar estado de orden
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, receivedDate, receivedQuantities, receiveNotes } = req.body;
    
    const updateData = { status };
    if (status === 'Recibida' && receivedDate) {
      updateData.receivedDate = receivedDate;
    }
    if (receiveNotes) {
      updateData.receiveNotes = receiveNotes;
    }

    const order = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('supplier', 'name email phone')
      .populate('items.product', 'sku name');

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    // Si la orden fue recibida, actualizar el stock de los productos
    if (status === 'Recibida') {
      for (const item of order.items) {
        // Obtener el ID del producto (puede ser ObjectId o objeto poblado)
        const productId = item.product?._id || item.product;
        
        // Usar la cantidad recibida si está disponible, de lo contrario usar la cantidad original
        let quantityToAdd = item.quantity;
        if (receivedQuantities && receivedQuantities[item._id]) {
          quantityToAdd = receivedQuantities[item._id];
        }
        
        // Actualizar stock con la cantidad recibida
        await Product.findByIdAndUpdate(
          productId,
          { $inc: { stock: quantityToAdd } }
        );
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ message: 'Error al actualizar orden' });
  }
};

// Enviar orden de compra por email al proveedor
export const sendPurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    // Verificar que el proveedor tenga email
    if (!order.supplier.email) {
      return res.status(400).json({ 
        message: 'El proveedor no tiene email configurado. Por favor actualiza sus datos.' 
      });
    }

    // Preparar datos para el email
    const orderData = {
      orderNumber: order.orderNumber,
      expectedDate: order.expectedDeliveryDate,
      totalAmount: order.total,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        productName: item.product?.name || 'Producto',
        quantity: item.quantity,
        unitCost: item.unitPrice,
        total: item.subtotal
      }))
    };

    // Enviar email (la función lee settings desde la BD)
    await sendPurchaseOrderEmail(orderData, order.supplier);

    // Actualizar estado de la orden
    order.emailSent = true;
    order.emailSentDate = new Date();
    await order.save();

    res.json({ 
      message: `Orden enviada exitosamente a ${order.supplier.email}`,
      order 
    });
  } catch (error) {
    console.error('Error al enviar orden:', error);
    res.status(500).json({ 
      message: 'Error al enviar orden de compra', 
      error: error.message 
    });
  }
};

// Eliminar orden
export const deletePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    res.json({ message: 'Orden eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ message: 'Error al eliminar orden' });
  }
};
