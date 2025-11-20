import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Return from '../models/Return.js';

// @desc    Obtener estadísticas del dashboard (optimizado)
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calcular ventas usando agregación
    const salesStats = await Sale.aggregate([
      {
        $match: {
          status: 'Completada',
          total: { $ne: null, $exists: true }
        }
      },
      {
        $facet: {
          today: [
            { $match: { createdAt: { $gte: today } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$total' },
                count: { $sum: 1 }
              }
            }
          ],
          week: [
            { $match: { createdAt: { $gte: startOfWeek } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$total' },
                count: { $sum: 1 }
              }
            }
          ],
          month: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$total' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Calcular devoluciones aprobadas usando agregación
    const returnsStats = await Return.aggregate([
      {
        $match: {
          status: 'Aprobada',
          totalAmount: { $ne: null, $exists: true }
        }
      },
      {
        $facet: {
          today: [
            { $match: { createdAt: { $gte: today } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$totalAmount' },
                count: { $sum: 1 }
              }
            }
          ],
          week: [
            { $match: { createdAt: { $gte: startOfWeek } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$totalAmount' },
                count: { $sum: 1 }
              }
            }
          ],
          month: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
              $group: {
                _id: null,
                total: { $sum: '$totalAmount' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const todayData = salesStats[0].today[0] || { total: 0, count: 0 };
    const weekData = salesStats[0].week[0] || { total: 0, count: 0 };
    const monthData = salesStats[0].month[0] || { total: 0, count: 0 };

    const todayReturns = returnsStats[0].today[0] || { total: 0, count: 0 };
    const weekReturns = returnsStats[0].week[0] || { total: 0, count: 0 };
    const monthReturns = returnsStats[0].month[0] || { total: 0, count: 0 };

    // Calcular totales netos (ventas - devoluciones)
    const todayNetTotal = todayData.total - todayReturns.total;
    const weekNetTotal = weekData.total - weekReturns.total;
    const monthNetTotal = monthData.total - monthReturns.total;

    // Ejecutar queries de conteo en paralelo
    const [lowStockCount, totalProducts, totalCustomers, activeUsers] = await Promise.all([
      Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
      Product.countDocuments(),
      Customer.countDocuments(),
      User.countDocuments({ isActive: true })
    ]);

    res.json({
      today: {
        total: todayNetTotal,
        transactions: todayData.count,
        avgTicket: todayData.count > 0 ? todayNetTotal / todayData.count : 0,
        returns: todayReturns.count,
        returnsAmount: todayReturns.total
      },
      week: {
        total: weekNetTotal,
        transactions: weekData.count,
        returns: weekReturns.count,
        returnsAmount: weekReturns.total
      },
      month: {
        total: monthNetTotal,
        transactions: monthData.count,
        returns: monthReturns.count,
        returnsAmount: monthReturns.total
      },
      inventory: {
        totalProducts,
        lowStockProducts: lowStockCount
      },
      customers: totalCustomers,
      users: activeUsers
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
};

// @desc    Obtener ventas por día (última semana)
// @route   GET /api/dashboard/sales-by-day
// @access  Private
export const getSalesByDay = async (req, res) => {
  try {
    const daysAgo = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(0, 0, 0, 0);

    // Obtener ventas por día
    const sales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'Completada'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Obtener devoluciones aprobadas por día
    const returns = await Return.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'Aprobada'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Crear mapa de devoluciones por fecha
    const returnsMap = {};
    returns.forEach(ret => {
      returnsMap[ret._id] = {
        total: ret.total,
        count: ret.count
      };
    });

    // Formatear para el frontend restando devoluciones
    const formattedSales = sales.map(item => {
      const returnData = returnsMap[item._id] || { total: 0, count: 0 };
      return {
        date: item._id,
        total: item.total - returnData.total, // Neto después de devoluciones
        transactions: item.count,
        returns: returnData.count,
        returnsAmount: returnData.total
      };
    });

    res.json(formattedSales);
  } catch (error) {
    console.error('Error al obtener ventas por día:', error);
    res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
  }
};

// @desc    Obtener productos más vendidos
// @route   GET /api/dashboard/top-products
// @access  Private
export const getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topProducts = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'Completada'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          name: '$product.name',
          sku: '$product.sku',
          totalQuantity: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

// @desc    Obtener ventas por método de pago
// @route   GET /api/dashboard/sales-by-payment
// @access  Private
export const getSalesByPayment = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const salesByPayment = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'Completada'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(salesByPayment);
  } catch (error) {
    console.error('Error al obtener ventas por método de pago:', error);
    res.status(500).json({ message: 'Error al obtener datos', error: error.message });
  }
};

// @desc    Obtener todos los datos del dashboard en una sola petición (OPTIMIZADO)
// @route   GET /api/dashboard/all
// @access  Private
export const getAllDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const days30Ago = new Date();
    days30Ago.setDate(days30Ago.getDate() - 30);
    const days7Ago = new Date();
    days7Ago.setDate(days7Ago.getDate() - 7);

    // Ejecutar TODAS las queries en paralelo
    const [salesStats, salesByDay, topProducts, salesByPayment, counts, lowStockItems] = await Promise.all([
      // Stats
      Sale.aggregate([
        { $match: { status: 'Completada', total: { $ne: null, $exists: true } } },
        {
          $facet: {
            today: [
              { $match: { createdAt: { $gte: today } } },
              { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
            ],
            week: [
              { $match: { createdAt: { $gte: startOfWeek } } },
              { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
            ],
            month: [
              { $match: { createdAt: { $gte: startOfMonth } } },
              { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
            ]
          }
        }
      ]),
      
      // Sales by day (last 7 days)
      Sale.aggregate([
        { $match: { createdAt: { $gte: days7Ago }, status: 'Completada', total: { $ne: null, $exists: true } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$total' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top products (last 30 days)
      Sale.aggregate([
        { $match: { createdAt: { $gte: days30Ago }, status: 'Completada', total: { $ne: null, $exists: true } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            _id: 1,
            name: '$product.name',
            sku: '$product.sku',
            totalQuantity: 1,
            totalRevenue: 1
          }
        }
      ]),
      
      // Sales by payment method (last 30 days)
      Sale.aggregate([
        { $match: { createdAt: { $gte: days30Ago }, status: 'Completada', total: { $ne: null, $exists: true } } },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$total' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Counts
      Promise.all([
        Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
        Product.countDocuments(),
        Customer.countDocuments(),
        User.countDocuments({ isActive: true })
      ]),
      
      // Low stock items
      Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
        .select('name sku stock lowStockThreshold')
        .sort({ stock: 1 })
        .limit(10)
        .lean()
    ]);

    const todayData = salesStats[0].today[0] || { total: 0, count: 0 };
    const weekData = salesStats[0].week[0] || { total: 0, count: 0 };
    const monthData = salesStats[0].month[0] || { total: 0, count: 0 };

    // Normalizar métodos de pago respetando capitalización correcta y mantener orden
    const paymentMethodMap = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia'
    };

    const normalizeMethodName = (value) => {
      const base = value ? value.toString().trim() : '';
      const lower = base.toLowerCase();
      if (!base) return 'Desconocido';
      if (paymentMethodMap[lower]) return paymentMethodMap[lower];
      if (lower.includes('efect')) return 'Efectivo';
      if (lower.includes('tarj')) return 'Tarjeta';
      if (lower.includes('trans')) return 'Transferencia';
      return base;
    };

    const aggregatedPaymentData = salesByPayment.reduce((acc, item) => {
      const normalizedName = normalizeMethodName(item._id);

      if (!acc[normalizedName]) {
        acc[normalizedName] = { name: normalizedName, total: 0, count: 0 };
      }

      acc[normalizedName].total += item.total || 0;
      acc[normalizedName].count += item.count || 0;
      return acc;
    }, {});

    const preferredOrder = ['Efectivo', 'Tarjeta', 'Transferencia'];

    const normalizedPaymentData = [
      ...preferredOrder
        .filter(method => aggregatedPaymentData[method])
        .map(method => aggregatedPaymentData[method]),
      ...Object.keys(aggregatedPaymentData)
        .filter(method => !preferredOrder.includes(method))
        .map(method => aggregatedPaymentData[method])
    ];

    res.json({
      stats: {
        today: {
          total: todayData.total,
          transactions: todayData.count,
          avgTicket: todayData.count > 0 ? todayData.total / todayData.count : 0
        },
        week: {
          total: weekData.total,
          transactions: weekData.count
        },
        month: {
          total: monthData.total,
          transactions: monthData.count
        },
        inventory: {
          totalProducts: counts[1],
          lowStockProducts: counts[0],
          lowStockItems: lowStockItems
        },
        customers: counts[2],
        users: counts[3]
      },
      salesByDay: salesByDay.map(item => ({
        date: item._id,
        total: item.total,
        transactions: item.count
      })),
      topProducts,
      salesByPayment: normalizedPaymentData
    });
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({ message: 'Error al obtener datos', error: error.message });
  }
};
