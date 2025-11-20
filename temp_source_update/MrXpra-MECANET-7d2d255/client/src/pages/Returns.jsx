/**
 * @file Returns.jsx
 * @description Gestión de devoluciones de productos
 * 
 * Responsabilidades:
 * - Listar devoluciones con filtros (status, fechas, búsqueda)
 * - Crear nueva devolución (cajero puede crear)
 * - Ver detalle de devolución
 * - Aprobar/Rechazar devolución (solo admin)
 * - Mostrar estadísticas de devoluciones
 * 
 * Estados:
 * - returns: Array de devoluciones desde backend
 * - stats: Objeto con totalReturns, pendingReturns, approvedReturns, totalAmount
 * - sales: Array de ventas (para seleccionar en crear devolución)
 * - filters: { status, search, startDate, endDate }
 * - showCreateModal: Boolean para modal crear
 * - showDetailModal: Boolean para modal detalle
 * - selectedReturn: Devolución seleccionada para detalle
 * 
 * APIs:
 * - GET /api/returns (con filtros)
 * - GET /api/returns/stats (estadísticas)
 * - POST /api/returns (crear devolución)
 * - GET /api/returns/:id (detalle)
 * - PUT /api/returns/:id/approve (aprobar, solo admin)
 * - PUT /api/returns/:id/reject (rechazar, solo admin)
 * - GET /api/sales (para listar ventas en crear devolución)
 * 
 * Flujo de Devolución:
 * 1. Cajero selecciona venta y productos a devolver
 * 2. Especifica razón y método de reembolso
 * 3. Devolución se crea con status 'Pendiente'
 * 4. Admin revisa y aprueba/rechaza
 * 5. Si aprueba: stock se devuelve + reembolso procesado
 * 
 * Form Data (Crear):
 * - sale: ID de la venta original
 * - items: Array de { product, quantity, priceAtSale }
 * - reason: 'Producto defectuoso', 'Producto equivocado', 'Cliente insatisfecho', 'Otra'
 * - refundMethod: 'Efectivo', 'Tarjeta', 'Crédito a cuenta'
 * - notes: Notas adicionales
 * 
 * UI Features:
 * - Tarjetas de estadísticas (KPIs)
 * - Tabla de devoluciones con badges de status
 * - Filtros expandibles
 * - Modal de detalle con historial
 * - Botones de aprobar/rechazar (solo admin, solo pendientes)
 */

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  FileText,
  TrendingUp,
  Calendar,
  Eye,
  Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getReturns, getReturnStats, createReturn, getSales } from '../services/api';
import { ReportsSkeleton } from '../components/SkeletonLoader';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '../store/settingsStore';

const Returns = () => {
  const { settings } = useSettingsStore();
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchData();
  }, [filters, pagination.page]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [returnsResponse, statsResponse] = await Promise.all([
        getReturns({ ...filters, page: pagination.page, limit: pagination.limit }),
        getReturnStats(filters),
      ]);
      
      // Backend ahora devuelve { returns, pagination }
      const returnsData = returnsResponse?.data?.returns || returnsResponse?.returns || [];
      const paginationData = returnsResponse?.data?.pagination || returnsResponse?.pagination || {};
      
      // Asegurar que statsData tiene la estructura correcta
      const statsData = statsResponse?.data || statsResponse || null;
      
      setReturns(returnsData);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar devoluciones:', error);
      toast.error('Error al cargar devoluciones');
      setReturns([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReturn = async (returnData) => {
    try {
      await createReturn(returnData);
      toast.success('Devolución creada exitosamente');
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      console.error('Error al crear devolución:', error);
      toast.error(error.response?.data?.message || 'Error al crear devolución');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      Aprobada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      Completada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      Rechazada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getReasonBadge = (reason) => {
    const badges = {
      Defectuoso: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      Incorrecto: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'No necesario': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      Cambio: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      Otro: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return badges[reason] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const handlePrintReturn = (returnData) => {
    const printWindow = window.open('', '_blank');
    
    // Calcular total de items devueltos
    const returnTotal = returnData.items.reduce((sum, item) => sum + item.returnAmount, 0);
    
    // Calcular total de items de cambio
    const exchangeTotal = returnData.exchangeItems?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Devolución ${returnData.returnNumber}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 10mm; }
            }
            body { 
              font-family: 'Courier New', monospace; 
              width: 80mm;
              margin: 0 auto;
              padding: 5mm;
              font-size: 11px;
            }
            h1 { 
              text-align: center; 
              font-size: 16px; 
              margin: 5px 0;
              font-weight: bold;
            }
            h2 {
              text-align: center;
              font-size: 14px;
              margin: 5px 0;
              font-weight: bold;
              color: #d32f2f;
            }
            .line { 
              border-top: 1px dashed #000; 
              margin: 8px 0; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse;
            }
            td { 
              padding: 2px 0; 
            }
            .right { 
              text-align: right; 
            }
            .bold { 
              font-weight: bold; 
            }
            .center { 
              text-align: center; 
            }
            .small { 
              font-size: 9px; 
            }
            .info-section {
              margin: 8px 0;
              font-size: 12px;
              font-weight: bold;
            }
            .item-row {
              margin-bottom: 4px;
            }
            .total-row {
              font-size: 13px;
              font-weight: bold;
              padding-top: 4px;
            }
            .exchange-section {
              margin: 8px 0;
              padding: 6px;
              border: 2px solid #1976d2;
              background: #e3f2fd;
            }
            .exchange-title {
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 4px;
            }
            .difference-box {
              margin: 8px 0;
              padding: 6px;
              border: 2px solid #000;
              font-weight: bold;
            }
            .difference-positive {
              background: #ffebee;
              color: #d32f2f;
            }
            .difference-negative {
              background: #e8f5e9;
              color: #388e3c;
            }
          </style>
        </head>
        <body>
          <h1>${settings.businessName || 'MECANET'}</h1>
          <h2>NOTA DE DEVOLUCIÓN</h2>
          <div class="line"></div>
          
          <div class="info-section">
            <div><strong>No. Devolución:</strong> ${returnData.returnNumber}</div>
            <div><strong>Fecha:</strong> ${new Date(returnData.createdAt).toLocaleString('es-DO', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</div>
            <div><strong>Factura Original:</strong> ${returnData.sale?.invoiceNumber || 'N/A'}</div>
            ${returnData.customer ? `<div><strong>Cliente:</strong> ${returnData.customer.fullName || returnData.customer.name || 'Cliente General'}</div>` : '<div><strong>Cliente:</strong> Cliente General</div>'}
            ${returnData.customer?.cedula ? `<div><strong>Cédula:</strong> ${returnData.customer.cedula}</div>` : ''}
            <div><strong>Razón:</strong> ${returnData.reason}</div>
            <div><strong>Estado:</strong> ${returnData.status}</div>
          </div>
          
          <div class="line"></div>
          
          <div class="bold center">PRODUCTOS DEVUELTOS</div>
          <table>
            <thead>
              <tr class="bold small">
                <td style="width: 10%;">#</td>
                <td style="width: 50%;">PRODUCTO</td>
                <td style="width: 20%;" class="center">CANT</td>
                <td style="width: 20%;" class="right">TOTAL</td>
              </tr>
            </thead>
            <tbody>
              ${returnData.items.map((item, index) => `
                <tr class="item-row">
                  <td>${index + 1}</td>
                  <td>${item.product?.name || 'Producto'}</td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">${formatCurrency(item.returnAmount)}</td>
                </tr>
                <tr class="small">
                  <td></td>
                  <td colspan="3">${formatCurrency(item.originalPrice)} c/u</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${returnData.exchangeItems && returnData.exchangeItems.length > 0 ? `
            <div class="line"></div>
            <div class="exchange-section">
              <div class="exchange-title center">🔄 PRODUCTOS DE CAMBIO</div>
              <table>
                <thead>
                  <tr class="bold small">
                    <td style="width: 10%;">#</td>
                    <td style="width: 50%;">PRODUCTO</td>
                    <td style="width: 20%;" class="center">CANT</td>
                    <td style="width: 20%;" class="right">TOTAL</td>
                  </tr>
                </thead>
                <tbody>
                  ${returnData.exchangeItems.map((item, index) => `
                    <tr class="item-row">
                      <td>${index + 1}</td>
                      <td>${item.product?.name || 'Producto'}</td>
                      <td class="center">${item.quantity}</td>
                      <td class="right">${formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                    <tr class="small">
                      <td></td>
                      <td colspan="3">${formatCurrency(item.price)} c/u</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <div class="line"></div>
          
          <table>
            ${returnData.exchangeItems && returnData.exchangeItems.length > 0 ? `
              <tr>
                <td>Valor devuelto:</td>
                <td class="right">${formatCurrency(returnTotal)}</td>
              </tr>
              <tr>
                <td>Valor cambio:</td>
                <td class="right">${formatCurrency(exchangeTotal)}</td>
              </tr>
              <tr class="line"><td colspan="2"></td></tr>
              ${returnData.priceDifference !== undefined && returnData.priceDifference !== 0 ? `
                <tr class="total-row ${returnData.priceDifference > 0 ? 'difference-positive' : 'difference-negative'}">
                  <td>${returnData.priceDifference > 0 ? 'Cliente pagó:' : 'Se devolvió:'}</td>
                  <td class="right">${formatCurrency(Math.abs(returnData.priceDifference))}</td>
                </tr>
              ` : `
                <tr class="total-row">
                  <td colspan="2" class="center">SIN DIFERENCIA DE PRECIO</td>
                </tr>
              `}
            ` : `
              <tr class="total-row">
                <td>TOTAL DEVUELTO:</td>
                <td class="right">${formatCurrency(returnData.totalAmount)}</td>
              </tr>
              <tr>
                <td colspan="2" class="center small" style="padding-top: 4px;">
                  Método: ${returnData.refundMethod}
                </td>
              </tr>
            `}
          </table>
          
          ${returnData.notes ? `
            <div class="line"></div>
            <div>
              <div class="bold">Notas:</div>
              <div class="small">${returnData.notes}</div>
            </div>
          ` : ''}
          
          <div class="line"></div>
          <div class="small">
            <div>Procesado por: ${returnData.processedBy?.name || 'N/A'}</div>
            ${returnData.approvedBy ? `<div>Aprobado por: ${returnData.approvedBy?.name}</div>` : ''}
          </div>
          
          <div class="line"></div>
          <p class="center bold">Gracias por su comprensión</p>
          <p class="center small">Este documento no tiene validez fiscal</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading && returns.length === 0) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Devoluciones y Reembolsos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las devoluciones de productos y reembolsos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Package className="w-5 h-5" />
          Nueva Devolución
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Devoluciones
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.totalReturns || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card-glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monto Devuelto
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(stats?.totalAmountReturned || 0)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="card-glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pendientes
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {stats?.returnsByStatus?.find(s => s._id === 'Pendiente')?.count || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="card-glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completadas
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats?.returnsByStatus?.find(s => s._id === 'Completada')?.count || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card-glass p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar por número o factura
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="DEV-000001 o INV2511150001"
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Completada">Completada</option>
              <option value="Rechazada">Rechazada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha inicio
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha fin
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Devoluciones */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Venta Original
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Razón
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Array.isArray(returns) && returns.map((returnItem) => (
                <tr 
                  key={returnItem._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {returnItem.returnNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {returnItem.sale?.invoiceNumber || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {returnItem.customer?.fullName || 'Cliente General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReasonBadge(returnItem.reason)}`}>
                      {returnItem.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(returnItem.totalAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(returnItem.status)}`}>
                      {returnItem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(returnItem.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrintReturn(returnItem)}
                        className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Imprimir devolución"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReturn(returnItem);
                          setShowDetailModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        title="Ver detalles"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {returns.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No se encontraron devoluciones
            </p>
          </div>
        )}

        {/* Paginación */}
        {!isLoading && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} devoluciones
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrevPage}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pagination.hasPrevPage
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                Página {pagination.page} de {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNextPage}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pagination.hasNextPage
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Nueva Devolución */}
      {showCreateModal && (
        <CreateReturnModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateReturn}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Modal de Detalle */}
      {showDetailModal && selectedReturn && (
        <ReturnDetailModal
          returnData={selectedReturn}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReturn(null);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusBadge={getStatusBadge}
          getReasonBadge={getReasonBadge}
        />
      )}
    </div>
  );
};

// Modal para crear nueva devolución
const CreateReturnModal = ({ onClose, onSubmit, formatCurrency }) => {
  const [step, setStep] = useState(1); // 1: Buscar venta, 2: Seleccionar items, 3: Detalles, 4: Seleccionar cambio
  const [searchTerm, setSearchTerm] = useState('');
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState('Efectivo');
  const [isSearching, setIsSearching] = useState(false);
  
  // Estados para cambio de productos
  const [exchangeItems, setExchangeItems] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [modalError, setModalError] = useState(null);

  // Cargar productos disponibles cuando la razón es "Cambio"
  useEffect(() => {
    if (reason === 'Cambio') {
      loadAvailableProducts();
    }
  }, [reason]);

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const loadAvailableProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const { getProducts } = await import('../services/api');
      const response = await getProducts();
      const productsData = Array.isArray(response?.data) 
        ? response.data 
        : Array.isArray(response) 
          ? response 
          : [];
      
      // Filtrar productos con stock disponible
      const availableProds = productsData.filter(p => p.stock > 0);
      setAvailableProducts(availableProds);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos disponibles');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const addExchangeProduct = (product) => {
    // Verificar si ya está agregado
    const exists = exchangeItems.find(item => item.productId === product._id);
    if (exists) {
      toast.info('Este producto ya fue agregado');
      return;
    }

    setExchangeItems([...exchangeItems, {
      productId: product._id,
      productName: product.name,
      price: product.sellingPrice,
      quantity: 1,
      maxStock: product.stock,
    }]);
  };

  const removeExchangeProduct = (productId) => {
    setExchangeItems(exchangeItems.filter(item => item.productId !== productId));
  };

  const updateExchangeQuantity = (productId, quantity) => {
    const newItems = exchangeItems.map(item => {
      if (item.productId === productId) {
        const qty = parseInt(quantity) || 0;
        return { ...item, quantity: Math.min(Math.max(1, qty), item.maxStock) };
      }
      return item;
    });
    setExchangeItems(newItems);
  };

  const getExchangeTotal = () => {
    return exchangeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getPriceDifference = () => {
    const returnTotal = getTotalAmount();
    const exchangeTotal = getExchangeTotal();
    return exchangeTotal - returnTotal;
  };

  const searchSales = async () => {
    if (!searchTerm) {
      toast.error('Ingrese un número de factura');
      return;
    }
    
    try {
      setIsSearching(true);
      // Limpiar el término de búsqueda (remover espacios y hacer trim)
      const cleanSearch = searchTerm.trim().replace(/\s+/g, '');
      const response = await getSales({ search: cleanSearch });
      
      // El backend devuelve { sales: [...], pagination: {...} }
      const salesData = response?.data?.sales || response?.sales || [];
      
      console.log('🔍 Sales search response:', response?.data);
      console.log('🔍 Sales found:', salesData);
      
      // Filtrar ventas válidas para devolución
      const validSales = salesData.filter(sale => 
        sale.status !== 'Cancelada' && sale.status !== 'Devuelta'
      );
      
      setSales(validSales);
      
      if (validSales.length === 0) {
        if (salesData.length > 0) {
          toast.error('La venta encontrada ya fue cancelada o devuelta');
        } else {
          toast.error(`No se encontraron ventas con el código: ${cleanSearch}`);
        }
      }
    } catch (error) {
      console.error('Error al buscar ventas:', error);
      toast.error(error.response?.data?.message || 'Error al buscar ventas');
      setSales([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSale = async (sale) => {
    try {
      // Obtener detalles completos de la venta con información de devoluciones
      const { getSaleById } = await import('../services/api');
      const response = await getSaleById(sale._id);
      const fullSale = response.data || response;
      
      console.log('🔍 Full sale with return info:', fullSale);
      console.log('📦 Items with availability:', fullSale.items);
      
      setSelectedSale(fullSale);
      
      // Validar que la venta tenga items
      if (!fullSale.items || fullSale.items.length === 0) {
        setModalError('Esta venta no tiene productos registrados.');
        return;
      }
      
      // Filtrar items válidos (que tengan producto)
      const validItems = fullSale.items.filter(item => {
      // Verificar si el producto existe (puede ser objeto o ID string)
      if (typeof item.product === 'object' && item.product !== null) {
        return item.product._id; // Producto poblado
      } else if (typeof item.product === 'string') {
        // Producto como ID string, verificar que no sea null/undefined
        return item.product;
      }
      return false;
    });
    
    if (validItems.length === 0) {
      setModalError('Esta venta no tiene productos válidos para devolver. Los productos pueden haber sido eliminados del sistema.');
      // No mostrar toast cuando hay modalError, solo mostrar en el modal
      return;
    }
    
    // Mapear items válidos
    const mappedItems = validItems.map(item => {
      // Manejar tanto productos poblados como IDs
      const productId = typeof item.product === 'object' 
        ? item.product._id 
        : item.product;
      
      const productName = typeof item.product === 'object' && item.product.name
        ? item.product.name 
        : 'Producto (eliminado)';
      
      // Usar availableToReturn si está disponible, sino usar quantity original
      const maxAvailable = item.availableToReturn !== undefined 
        ? item.availableToReturn 
        : item.quantity;
      
      return {
        productId: productId,
        productName: productName,
        maxQuantity: maxAvailable,
        originalQuantity: item.quantity,
        returnedQuantity: item.returnedQuantity || 0,
        priceAtSale: item.priceAtSale || 0,
        quantity: 0,
        selected: false,
      };
    });
    
    setReturnItems(mappedItems);
    
    // Advertir si algunos productos no están disponibles
    if (validItems.length < fullSale.items.length) {
      toast.warning(`${fullSale.items.length - validItems.length} producto(s) no disponible(s) para devolución (eliminados del sistema)`);
    }
    
    setStep(2);
    } catch (error) {
      console.error('Error al obtener detalles de la venta:', error);
      toast.error('Error al cargar detalles de la venta');
    }
  };

  const toggleItem = (index) => {
    const newItems = [...returnItems];
    newItems[index].selected = !newItems[index].selected;
    if (newItems[index].selected && newItems[index].quantity === 0) {
      newItems[index].quantity = newItems[index].maxQuantity;
    }
    setReturnItems(newItems);
  };

  const updateQuantity = (index, quantity) => {
    const newItems = [...returnItems];
    // Permitir valores vacíos temporalmente
    if (quantity === '' || quantity === null || quantity === undefined) {
      newItems[index].quantity = '';
      setReturnItems(newItems);
      return;
    }
    const qty = parseInt(quantity);
    if (!isNaN(qty)) {
      newItems[index].quantity = Math.min(Math.max(0, qty), newItems[index].maxQuantity);
      setReturnItems(newItems);
    }
  };

  const getTotalAmount = () => {
    return returnItems
      .filter(item => item.selected && item.quantity > 0)
      .reduce((sum, item) => {
        const qty = typeof item.quantity === 'number' ? item.quantity : (parseInt(item.quantity) || 0);
        return sum + (item.priceAtSale * qty);
      }, 0);
  };

  const handleSubmit = () => {
    const selectedItems = returnItems.filter(item => item.selected && item.quantity > 0);
    
    if (selectedItems.length === 0) {
      toast.error('Debe seleccionar al menos un producto');
      return;
    }

    if (!reason) {
      toast.error('Debe seleccionar una razón');
      return;
    }

    // Si es cambio, validar que haya productos de cambio
    if (reason === 'Cambio' && exchangeItems.length === 0) {
      toast.error('Debe seleccionar al menos un producto para el cambio');
      return;
    }

    const returnData = {
      saleId: selectedSale._id,
      items: selectedItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      reason,
      notes,
      refundMethod,
    };

    // Si es cambio, agregar los productos de cambio y la diferencia de precio
    if (reason === 'Cambio') {
      returnData.exchangeItems = exchangeItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));
      returnData.priceDifference = getPriceDifference();
    }

    onSubmit(returnData);
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 100000 }}>
      <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nueva Devolución
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                1
              </div>
              <div className={`w-20 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                2
              </div>
              <div className={`w-20 h-1 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Buscar venta */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Mensaje de error dentro del modal */}
              {modalError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-300">Error al seleccionar venta</p>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">{modalError}</p>
                    </div>
                    <button
                      onClick={() => setModalError(null)}
                      className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar venta por número de factura
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setModalError(null); // Limpiar error al escribir
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && searchSales()}
                    placeholder="Ingrese número de factura..."
                    className="input flex-1"
                  />
                  <button onClick={searchSales} className="btn-primary flex items-center gap-2" disabled={isSearching}>
                    <Search className="w-5 h-5" />
                    Buscar
                  </button>
                </div>
              </div>

              {sales.length > 0 && (
                <div className="space-y-2">
                  {sales.map((sale) => {
                    // Contar productos válidos
                    const validItemsCount = sale.items.filter(item => {
                      if (typeof item.product === 'object' && item.product !== null) {
                        return item.product._id;
                      } else if (typeof item.product === 'string') {
                        return item.product;
                      }
                      return false;
                    }).length;
                    
                    const hasInvalidItems = validItemsCount < sale.items.length;
                    
                    return (
                      <div
                        key={sale._id}
                        onClick={() => selectSale(sale)}
                        className="card-glass p-4 cursor-pointer hover:border-primary-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {sale.invoiceNumber}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {sale.customer?.fullName || 'Cliente General'} • {new Date(sale.createdAt).toLocaleDateString()}
                            </p>
                            {hasInvalidItems && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {validItemsCount} de {sale.items.length} productos disponibles
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {formatCurrency(sale.total)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {sale.items.length} producto{sale.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Seleccionar items */}
          {step === 2 && (
            <div className="space-y-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Cambiar venta
              </button>

              <div className="card-glass p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Venta seleccionada</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedSale.invoiceNumber}</p>
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-3">
                  Seleccione los productos a devolver:
                </p>
                <div className="space-y-2">
                  {returnItems.map((item, index) => (
                    <div key={index} className={`card-glass p-4 ${item.maxQuantity === 0 ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleItem(index)}
                          disabled={item.maxQuantity === 0}
                          className="w-5 h-5 text-primary-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Precio: {formatCurrency(item.priceAtSale)}
                          </p>
                          {item.returnedQuantity > 0 ? (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              Original: {item.originalQuantity} • Devuelto: {item.returnedQuantity} • Disponible: {item.maxQuantity}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Disponible: {item.maxQuantity}
                            </p>
                          )}
                          {item.maxQuantity === 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                              ⚠️ Ya se devolvieron todas las unidades
                            </p>
                          )}
                        </div>
                        {item.selected && item.maxQuantity > 0 && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                              Cantidad:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={item.maxQuantity}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, e.target.value)}
                              className="input w-20"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-glass p-4 border-2 border-primary-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Total a devolver:</span>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(getTotalAmount())}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={getTotalAmount() === 0}
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step 3: Detalles */}
          {step === 3 && (
            <div className="space-y-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Razón de la devolución <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Seleccione una razón</option>
                  <option value="Defectuoso">Defectuoso</option>
                  <option value="Incorrecto">Incorrecto</option>
                  <option value="No necesario">No necesario</option>
                  <option value="Cambio">Cambio</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Si es cambio, mostrar botón para seleccionar productos */}
              {reason === 'Cambio' && (
                <div className="card-glass p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500/30">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        🔄 Cambio de Productos
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {exchangeItems.length > 0 
                          ? `${exchangeItems.length} producto(s) seleccionado(s) para cambio`
                          : 'Seleccione los productos por los que desea cambiar'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(4)}
                    className="btn btn-primary w-full"
                  >
                    {exchangeItems.length > 0 ? 'Modificar productos de cambio' : 'Seleccionar productos de cambio'}
                  </button>
                  
                  {exchangeItems.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {exchangeItems.map(item => (
                        <div key={item.productId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {item.productName} x{item.quantity}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-blue-300 dark:border-blue-700 pt-2 mt-2">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-gray-900 dark:text-white">Diferencia:</span>
                          <span className={getPriceDifference() >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                            {getPriceDifference() >= 0 ? '+' : ''}{formatCurrency(getPriceDifference())}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {getPriceDifference() > 0 
                            ? `Cliente debe pagar ${formatCurrency(getPriceDifference())}`
                            : getPriceDifference() < 0
                              ? `Se le devolvió ${formatCurrency(Math.abs(getPriceDifference()))}`
                              : 'Sin diferencia de precio'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Solo mostrar método de reembolso si NO es cambio */}
              {reason !== 'Cambio' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Método de reembolso <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Crédito en Tienda">Crédito en Tienda</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas adicionales
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Describa más detalles sobre la devolución..."
                />
              </div>

              <div className="card-glass p-4 border-2 border-primary-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    {reason === 'Cambio' ? 'Diferencia a pagar/devolver:' : 'Total a devolver:'}
                  </span>
                  <span className={`text-2xl font-bold ${
                    reason === 'Cambio' 
                      ? getPriceDifference() > 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {reason === 'Cambio' ? formatCurrency(Math.abs(getPriceDifference())) : formatCurrency(getTotalAmount())}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {reason === 'Cambio' 
                    ? getPriceDifference() > 0 
                      ? 'Cliente debe pagar la diferencia' 
                      : getPriceDifference() < 0
                        ? 'Se le devuelve al cliente'
                        : 'No hay diferencia de precio'
                    : `Método: ${refundMethod}`
                  }
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="btn btn-secondary flex-1">
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit} 
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={reason === 'Cambio' && exchangeItems.length === 0}
                >
                  <CheckCircle className="w-5 h-5" />
                  Procesar Devolución
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Seleccionar productos de cambio (solo si reason === 'Cambio') */}
          {step === 4 && reason === 'Cambio' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Seleccionar Productos de Cambio
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Busque y seleccione los productos por los que desea hacer el cambio
                </p>

                {/* Búsqueda de productos */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    placeholder="Buscar productos..."
                    className="input"
                  />
                </div>

                {/* Lista de productos agregados */}
                {exchangeItems.length > 0 && (
                  <div className="card-glass p-4 mb-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500/30">
                    <p className="font-medium text-green-900 dark:text-green-100 mb-3">
                      Productos Seleccionados para Cambio:
                    </p>
                    <div className="space-y-2">
                      {exchangeItems.map(item => (
                        <div key={item.productId} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.productName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(item.price)} c/u
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600 dark:text-gray-400">
                                Cant:
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={item.maxStock}
                                value={item.quantity}
                                onChange={(e) => updateExchangeQuantity(item.productId, e.target.value)}
                                className="input w-20"
                              />
                            </div>
                            <button
                              onClick={() => removeExchangeProduct(item.productId)}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-green-300 dark:border-green-700 pt-2 mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Total productos de cambio:
                          </span>
                          <span className="font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(getExchangeTotal())}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Total a devolver:
                          </span>
                          <span className="font-bold text-red-700 dark:text-red-400">
                            -{formatCurrency(getTotalAmount())}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-300 dark:border-green-700">
                          <span className="font-bold text-gray-900 dark:text-white">
                            Diferencia:
                          </span>
                          <span className={`font-bold text-lg ${getPriceDifference() >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {getPriceDifference() >= 0 ? '+' : ''}{formatCurrency(getPriceDifference())}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                          {getPriceDifference() > 0 
                            ? `El cliente debe pagar ${formatCurrency(getPriceDifference())} adicional`
                            : getPriceDifference() < 0
                              ? `Se le devolverá ${formatCurrency(Math.abs(getPriceDifference()))} al cliente`
                              : 'Cambio exacto, sin diferencia de precio'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de productos disponibles */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {isLoadingProducts ? (
                    <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                      Cargando productos...
                    </p>
                  ) : (
                    availableProducts
                      .filter(p => 
                        !productSearchTerm || 
                        p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
                      )
                      .map(product => (
                        <div
                          key={product._id}
                          className="card-glass p-4 cursor-pointer hover:border-primary-500 transition-colors"
                          onClick={() => addExchangeProduct(product)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                SKU: {product.sku} • Stock: {product.stock}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(product.sellingPrice)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Click para agregar
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setStep(3)}
                  className="btn btn-secondary flex-1"
                >
                  Volver a Detalles
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary flex-1"
                  disabled={exchangeItems.length === 0}
                >
                  Confirmar Selección
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Modal de detalle de devolución
const ReturnDetailModal = ({ returnData, onClose, formatCurrency, formatDate, getStatusBadge, getReasonBadge }) => {
  const { settings } = useSettingsStore();

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handlePrintReturn = () => {
    const printWindow = window.open('', '_blank');
    
    // Calcular total de items devueltos
    const returnTotal = returnData.items.reduce((sum, item) => sum + item.returnAmount, 0);
    
    // Calcular total de items de cambio
    const exchangeTotal = returnData.exchangeItems?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Devolución ${returnData.returnNumber}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 10mm; }
            }
            body { 
              font-family: 'Courier New', monospace; 
              width: 80mm;
              margin: 0 auto;
              padding: 5mm;
              font-size: 11px;
            }
            h1 { 
              text-align: center; 
              font-size: 16px; 
              margin: 5px 0;
              font-weight: bold;
            }
            h2 {
              text-align: center;
              font-size: 14px;
              margin: 5px 0;
              font-weight: bold;
              color: #d32f2f;
            }
            .line { 
              border-top: 1px dashed #000; 
              margin: 8px 0; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse;
            }
            td { 
              padding: 2px 0; 
            }
            .right { 
              text-align: right; 
            }
            .bold { 
              font-weight: bold; 
            }
            .center { 
              text-align: center; 
            }
            .small { 
              font-size: 9px; 
            }
            .info-section {
              margin: 8px 0;
              font-size: 12px;
              font-weight: bold;
            }
            .item-row {
              margin-bottom: 4px;
            }
            .total-row {
              font-size: 13px;
              font-weight: bold;
              padding-top: 4px;
            }
            .exchange-section {
              margin: 8px 0;
              padding: 6px;
              border: 2px solid #1976d2;
              background: #e3f2fd;
            }
            .exchange-title {
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 4px;
            }
            .difference-box {
              margin: 8px 0;
              padding: 6px;
              border: 2px solid #000;
              font-weight: bold;
            }
            .difference-positive {
              background: #ffebee;
              color: #d32f2f;
            }
            .difference-negative {
              background: #e8f5e9;
              color: #388e3c;
            }
          </style>
        </head>
        <body>
          <h1>${settings.businessName || 'MECANET'}</h1>
          <h2>NOTA DE DEVOLUCIÓN</h2>
          <div class="line"></div>
          
          <div class="info-section">
            <div><strong>No. Devolución:</strong> ${returnData.returnNumber}</div>
            <div><strong>Fecha:</strong> ${new Date(returnData.createdAt).toLocaleString('es-DO', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</div>
            <div><strong>Factura Original:</strong> ${returnData.sale?.invoiceNumber || 'N/A'}</div>
            ${returnData.customer ? `<div><strong>Cliente:</strong> ${returnData.customer.fullName || returnData.customer.name || 'Cliente General'}</div>` : '<div><strong>Cliente:</strong> Cliente General</div>'}
            ${returnData.customer?.cedula ? `<div><strong>Cédula:</strong> ${returnData.customer.cedula}</div>` : ''}
            <div><strong>Razón:</strong> ${returnData.reason}</div>
            <div><strong>Estado:</strong> ${returnData.status}</div>
          </div>
          
          <div class="line"></div>
          
          <div class="bold center">PRODUCTOS DEVUELTOS</div>
          <table>
            <thead>
              <tr class="bold small">
                <td style="width: 10%;">#</td>
                <td style="width: 50%;">PRODUCTO</td>
                <td style="width: 20%;" class="center">CANT</td>
                <td style="width: 20%;" class="right">TOTAL</td>
              </tr>
            </thead>
            <tbody>
              ${returnData.items.map((item, index) => `
                <tr class="item-row">
                  <td>${index + 1}</td>
                  <td>${item.product?.name || 'Producto'}</td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">${formatCurrency(item.returnAmount)}</td>
                </tr>
                <tr class="small">
                  <td></td>
                  <td colspan="3">${formatCurrency(item.originalPrice)} c/u</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${returnData.exchangeItems && returnData.exchangeItems.length > 0 ? `
            <div class="line"></div>
            <div class="exchange-section">
              <div class="exchange-title center">🔄 PRODUCTOS DE CAMBIO</div>
              <table>
                <thead>
                  <tr class="bold small">
                    <td style="width: 10%;">#</td>
                    <td style="width: 50%;">PRODUCTO</td>
                    <td style="width: 20%;" class="center">CANT</td>
                    <td style="width: 20%;" class="right">TOTAL</td>
                  </tr>
                </thead>
                <tbody>
                  ${returnData.exchangeItems.map((item, index) => `
                    <tr class="item-row">
                      <td>${index + 1}</td>
                      <td>${item.product?.name || 'Producto'}</td>
                      <td class="center">${item.quantity}</td>
                      <td class="right">${formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                    <tr class="small">
                      <td></td>
                      <td colspan="3">${formatCurrency(item.price)} c/u</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <div class="line"></div>
          
          <table>
            ${returnData.exchangeItems && returnData.exchangeItems.length > 0 ? `
              <tr>
                <td>Valor devuelto:</td>
                <td class="right">${formatCurrency(returnTotal)}</td>
              </tr>
              <tr>
                <td>Valor cambio:</td>
                <td class="right">${formatCurrency(exchangeTotal)}</td>
              </tr>
              <tr class="line"><td colspan="2"></td></tr>
              ${returnData.priceDifference !== undefined && returnData.priceDifference !== 0 ? `
                <tr class="total-row ${returnData.priceDifference > 0 ? 'difference-positive' : 'difference-negative'}">
                  <td>${returnData.priceDifference > 0 ? 'Cliente pagó:' : 'Se devolvió:'}</td>
                  <td class="right">${formatCurrency(Math.abs(returnData.priceDifference))}</td>
                </tr>
              ` : `
                <tr class="total-row">
                  <td colspan="2" class="center">SIN DIFERENCIA DE PRECIO</td>
                </tr>
              `}
            ` : `
              <tr class="total-row">
                <td>TOTAL DEVUELTO:</td>
                <td class="right">${formatCurrency(returnData.totalAmount)}</td>
              </tr>
              <tr>
                <td colspan="2" class="center small" style="padding-top: 4px;">
                  Método: ${returnData.refundMethod}
                </td>
              </tr>
            `}
          </table>
          
          ${returnData.notes ? `
            <div class="line"></div>
            <div>
              <div class="bold">Notas:</div>
              <div class="small">${returnData.notes}</div>
            </div>
          ` : ''}
          
          <div class="line"></div>
          <div class="small">
            <div>Procesado por: ${returnData.processedBy?.name || 'N/A'}</div>
            ${returnData.approvedBy ? `<div>Aprobado por: ${returnData.approvedBy?.name}</div>` : ''}
          </div>
          
          
          <div class="line"></div>
          <p class="center bold">Gracias por su comprensión</p>
          <p class="center small">Este documento no tiene validez fiscal</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 100000 }}>
      <div className="glass-strong rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Detalle de Devolución
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{returnData.returnNumber}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Info General */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card-glass p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Venta Original</p>
              <p className="font-medium text-gray-900 dark:text-white">{returnData.sale?.invoiceNumber}</p>
            </div>
            <div className="card-glass p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {returnData.customer?.fullName || 'Cliente General'}
              </p>
            </div>
            <div className="card-glass p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(returnData.status)}`}>
                {returnData.status}
              </span>
            </div>
            <div className="card-glass p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Razón</p>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getReasonBadge(returnData.reason)}`}>
                {returnData.reason}
              </span>
            </div>
            <div className="card-glass p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Método de Reembolso</p>
              <p className="font-medium text-gray-900 dark:text-white">{returnData.refundMethod}</p>
            </div>
            <div className="card-glass p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Fecha</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(returnData.createdAt)}</p>
            </div>
          </div>

          {/* Items Devueltos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Productos Devueltos
            </h3>
            <div className="space-y-2">
              {returnData.items.map((item, index) => (
                <div key={index} className="card-glass p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.product?.name || 'Producto'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cantidad: {item.quantity} × {formatCurrency(item.originalPrice)}
                      </p>
                    </div>
                    <p className="font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(item.returnAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items de Cambio (si existen) */}
          {returnData.exchangeItems && returnData.exchangeItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">🔄</span>
                Productos de Cambio
              </h3>
              <div className="space-y-2">
                {returnData.exchangeItems.map((item, index) => (
                  <div key={index} className="card-glass p-4 border-2 border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.product?.name || 'Producto'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Cantidad: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Diferencia de precio */}
              {returnData.priceDifference !== undefined && returnData.priceDifference !== 0 && (
                <div className={`mt-4 p-4 rounded-lg ${
                  returnData.priceDifference > 0 
                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' 
                    : 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      returnData.priceDifference > 0 
                        ? 'text-red-700 dark:text-red-300' 
                        : 'text-green-700 dark:text-green-300'
                    }`}>
                      {returnData.priceDifference > 0 
                        ? 'Cliente pagó diferencia:' 
                        : 'Se devolvió al cliente:'}
                    </span>
                    <span className={`text-lg font-bold ${
                      returnData.priceDifference > 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatCurrency(Math.abs(returnData.priceDifference))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          {returnData.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Notas
              </h3>
              <div className="card-glass p-4">
                <p className="text-gray-700 dark:text-gray-300">{returnData.notes}</p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="card-glass p-6 border-2 border-primary-500/30">
            <div className="flex items-center justify-between">
              <span className="text-lg text-gray-700 dark:text-gray-300">Total Devuelto:</span>
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(returnData.totalAmount)}
              </span>
            </div>
          </div>

          {/* Procesado por */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Procesado por: <span className="font-medium">{returnData.processedBy?.name}</span>
            </p>
            {returnData.approvedBy && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Aprobado por: <span className="font-medium">{returnData.approvedBy?.name}</span>
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handlePrintReturn}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Imprimir Devolución
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Returns;
