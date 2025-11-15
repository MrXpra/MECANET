import Quotation from '../models/Quotation.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';

// @desc    Obtener todas las cotizaciones
// @route   GET /api/quotations
// @access  Private
export const getQuotations = async (req, res) => {
  try {
    const { status, customer, startDate, endDate, search } = req.query;
    
    let query = {};

    // Filtro por estado
    if (status) {
      query.status = status;
    }

    // Filtro por cliente
    if (customer) {
      query.customer = customer;
    }

    // Filtro por rango de fechas
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate + 'T00:00:00.000');
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59.999');
      }
    }

    // Filtro por búsqueda de número
    if (search) {
      const cleanSearch = search.trim().replace(/[\s-]/g, '');
      query.$or = [
        { quotationNumber: { $regex: cleanSearch, $options: 'i' } },
        { quotationNumber: cleanSearch.toUpperCase() }
      ];
    }

    const quotations = await Quotation.find(query)
      .populate('customer', 'fullName phone email')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name email')
      .populate('convertedToSale', 'invoiceNumber')
      .sort({ createdAt: -1 })
      .lean();

    res.json(quotations);
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    res.status(500).json({ message: 'Error al obtener cotizaciones' });
  }
};

// @desc    Obtener una cotización por ID
// @route   GET /api/quotations/:id
// @access  Private
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer')
      .populate('items.product')
      .populate('createdBy', 'name email')
      .populate('processedBy', 'name email')
      .populate('convertedToSale');

    if (!quotation) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    res.json(quotation);
  } catch (error) {
    console.error('Error al obtener cotización:', error);
    res.status(500).json({ message: 'Error al obtener cotización' });
  }
};

// @desc    Crear nueva cotización
// @route   POST /api/quotations
// @access  Private
export const createQuotation = async (req, res) => {
  try {
    const { customer, items, validUntil, notes, terms } = req.body;

    // Validar cliente
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Validar y calcular items
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Producto ${item.product} no encontrado` });
      }

      const unitPrice = item.unitPrice || product.sellingPrice;
      const discount = item.discount || 0;
      const priceAfterDiscount = unitPrice * (1 - discount / 100);
      const itemSubtotal = priceAfterDiscount * item.quantity;
      
      subtotal += itemSubtotal;

      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        unitPrice: unitPrice,
        discount: discount,
        subtotal: itemSubtotal,
      });
    }

    // Calcular impuesto (18% ITBIS)
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    // Crear cotización
    const quotation = new Quotation({
      customer,
      items: processedItems,
      subtotal,
      tax,
      total,
      validUntil,
      notes,
      terms,
      createdBy: req.user.id,
    });

    await quotation.save();

    // Populate para retornar datos completos
    await quotation.populate('customer', 'fullName phone email');
    await quotation.populate('items.product', 'name sku');
    await quotation.populate('createdBy', 'name email');

    res.status(201).json(quotation);
  } catch (error) {
    console.error('Error al crear cotización:', error);
    res.status(500).json({ message: 'Error al crear cotización' });
  }
};

// @desc    Actualizar cotización
// @route   PUT /api/quotations/:id
// @access  Private
export const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Solo se puede editar si está pendiente
    if (quotation.status !== 'Pendiente') {
      return res.status(400).json({ 
        message: 'Solo se pueden editar cotizaciones pendientes' 
      });
    }

    const { customer, items, validUntil, notes, terms } = req.body;

    // Validar cliente si se proporciona
    if (customer && customer !== quotation.customer.toString()) {
      const customerExists = await Customer.findById(customer);
      if (!customerExists) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      quotation.customer = customer;
    }

    // Recalcular items si se proporcionan
    if (items && items.length > 0) {
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Producto ${item.product} no encontrado` });
        }

        const unitPrice = item.unitPrice || product.sellingPrice;
        const discount = item.discount || 0;
        const priceAfterDiscount = unitPrice * (1 - discount / 100);
        const itemSubtotal = priceAfterDiscount * item.quantity;
        
        subtotal += itemSubtotal;

        processedItems.push({
          product: item.product,
          quantity: item.quantity,
          unitPrice: unitPrice,
          discount: discount,
          subtotal: itemSubtotal,
        });
      }

      const tax = subtotal * 0.18;
      const total = subtotal + tax;

      quotation.items = processedItems;
      quotation.subtotal = subtotal;
      quotation.tax = tax;
      quotation.total = total;
    }

    if (validUntil) quotation.validUntil = validUntil;
    if (notes !== undefined) quotation.notes = notes;
    if (terms !== undefined) quotation.terms = terms;

    await quotation.save();

    await quotation.populate('customer', 'fullName phone email');
    await quotation.populate('items.product', 'name sku');
    await quotation.populate('createdBy', 'name email');

    res.json(quotation);
  } catch (error) {
    console.error('Error al actualizar cotización:', error);
    res.status(500).json({ message: 'Error al actualizar cotización' });
  }
};

// @desc    Eliminar cotización
// @route   DELETE /api/quotations/:id
// @access  Private (Admin only)
export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // No permitir eliminar si ya fue convertida
    if (quotation.status === 'Convertida') {
      return res.status(400).json({ 
        message: 'No se puede eliminar una cotización que ya fue convertida en venta' 
      });
    }

    await quotation.deleteOne();

    res.json({ message: 'Cotización eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cotización:', error);
    res.status(500).json({ message: 'Error al eliminar cotización' });
  }
};

// @desc    Convertir cotización a venta
// @route   POST /api/quotations/:id/convert
// @access  Private
export const convertToSale = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('items.product');

    if (!quotation) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Validar estado
    if (quotation.status === 'Convertida') {
      return res.status(400).json({ 
        message: 'Esta cotización ya fue convertida en venta' 
      });
    }

    if (quotation.status === 'Rechazada' || quotation.status === 'Vencida') {
      return res.status(400).json({ 
        message: 'No se puede convertir una cotización rechazada o vencida' 
      });
    }

    // Verificar stock disponible
    for (const item of quotation.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Stock insuficiente para ${item.product.name}. Disponible: ${item.product.stock}, Requerido: ${item.quantity}` 
        });
      }
    }

    const { paymentMethod, globalDiscount = 0 } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ message: 'Método de pago requerido' });
    }

    // Crear venta con los datos de la cotización
    const saleItems = quotation.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      priceAtSale: item.unitPrice,
      discountApplied: item.discount,
    }));

    const sale = new Sale({
      items: saleItems,
      customer: quotation.customer,
      paymentMethod,
      globalDiscount,
      globalDiscountAmount: 0,
      user: req.user.id,
      status: 'Completada',
    });

    // Calcular totales de la venta
    let saleSubtotal = 0;
    let totalDiscountFromItems = 0;

    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      const priceAfterDiscount = item.priceAtSale * (1 - item.discountApplied / 100);
      const itemTotal = priceAfterDiscount * item.quantity;
      saleSubtotal += item.priceAtSale * item.quantity;
      totalDiscountFromItems += (item.priceAtSale - priceAfterDiscount) * item.quantity;

      // Actualizar stock
      product.stock -= item.quantity;
      product.soldCount = (product.soldCount || 0) + item.quantity;
      await product.save();
    }

    const globalDiscountAmount = (globalDiscount / 100) * (saleSubtotal - totalDiscountFromItems);
    
    sale.subtotal = saleSubtotal;
    sale.totalDiscount = totalDiscountFromItems + globalDiscountAmount;
    sale.total = saleSubtotal - sale.totalDiscount;
    sale.globalDiscountAmount = globalDiscountAmount;

    await sale.save();

    // Actualizar cotización
    quotation.status = 'Convertida';
    quotation.convertedToSale = sale._id;
    quotation.convertedDate = new Date();
    quotation.processedBy = req.user.id;
    await quotation.save();

    await sale.populate('customer', 'fullName phone email');
    await sale.populate('items.product', 'name sku');
    await sale.populate('user', 'name email');

    res.json({
      message: 'Cotización convertida en venta exitosamente',
      sale,
      quotation
    });
  } catch (error) {
    console.error('Error al convertir cotización:', error);
    res.status(500).json({ message: 'Error al convertir cotización en venta' });
  }
};

// @desc    Cambiar estado de cotización (Aprobar/Rechazar)
// @route   PUT /api/quotations/:id/status
// @access  Private
export const updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    if (!['Aprobada', 'Rechazada'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    quotation.status = status;
    quotation.processedBy = req.user.id;
    await quotation.save();

    await quotation.populate('customer', 'fullName phone email');
    await quotation.populate('createdBy', 'name email');
    await quotation.populate('processedBy', 'name email');

    res.json(quotation);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado de cotización' });
  }
};
