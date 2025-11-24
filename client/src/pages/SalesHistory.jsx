/**
 * @file SalesHistory.jsx
 * @description Historial completo de ventas con filtros y detalles
 * 
 * Responsabilidades:
 * - Listar todas las ventas con filtros
 * - Ver detalle de venta (modal con items)
 * - Cancelar venta (solo admin)
 * - Reimprimir recibo
 * - Exportar ventas (CSV/Excel)
 * - Copiar ID de factura al portapapeles
 * 
 * Estados:
 * - sales: Array de ventas desde backend
 * - filters: { search, status, paymentMethod, startDate, endDate }
 * - showDetailModal: Boolean para modal detalle
 * - selectedSale: Venta seleccionada para detalle
 * - showCancelModal: Boolean para confirmación de cancelación
 * - saleToCancel: Venta a cancelar
 * - copiedId: ID de factura copiada (para feedback visual)
 * 
 * APIs:
 * - GET /api/sales (con filtros: startDate, endDate, status, paymentMethod)
 * - GET /api/sales/:id (detalle)
 * - PUT /api/sales/:id/cancel (cancelar, solo admin)
 * 
 * Filtros:
 * - search: Búsqueda por invoiceNumber o customer.fullName
 * - status: 'Completada', 'Cancelada'
 * - paymentMethod: 'Efectivo', 'Tarjeta', 'Transferencia'
 * - startDate, endDate: Rango de fechas
 * 
 * Detalle de Venta:
 * - invoiceNumber, fecha, cajero
 * - Cliente (nombre, identificación)
 * - Items: producto, cantidad, precio, subtotal
 * - Subtotal, descuentos, total
 * - Método de pago
 * - Status
 * 
 * Cancelación (solo admin):
 * - Cambia status a 'Cancelada'
 * - Devuelve stock de productos
 * - Irreversible (requiere confirmación)
 * 
 * UI Features:
 * - Tabla con skeleton loader
 * - Badge de status y método de pago
 * - Botón copiar invoiceNumber con feedback visual
 * - Modal de detalle con impresión
 * - Confirmación antes de cancelar
 * - Exportación de datos
 */

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  FileText,
  Eye,
  Printer,
  Download,
  X,
  User,
  CreditCard,
  Package,
  TrendingUp,
  ShoppingCart,
  Copy,
  Check,
  XCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { toast } from 'react-hot-toast';
import { getSales, cancelSale } from '../services/api';
import { useSettingsStore } from '../store/settingsStore';
import { TableSkeleton } from '../components/SkeletonLoader';
import { createPortal } from 'react-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Select,
  MenuItem,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Stack,
  Divider,
  useTheme,
  Avatar
} from '@mui/material';

const SalesHistory = () => {
  const { settings } = useSettingsStore();
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
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

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    fetchSales();
  }, [filters, pagination.page]);

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const response = await getSales({ ...filters, page: pagination.page, limit: pagination.limit });

      // El backend ahora devuelve { sales, pagination, stats }
      const salesData = response?.data?.sales || response?.sales || [];
      const paginationData = response?.data?.pagination || response?.pagination || {};
      const statsData = response?.data?.stats || response?.stats || null;

      setSales(salesData);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));

      // Usar stats del backend si están disponibles, sino calcular localmente
      if (statsData) {
        setStats(statsData);
      } else {
        calculateStats(salesData);
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      toast.error('Error al cargar historial de ventas');
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (salesData) => {
    const completed = salesData.filter(s => s.status === 'Completada').length;
    const cancelled = salesData.filter(s => s.status === 'Cancelada').length;
    const totalAmount = salesData
      .filter(s => s.status === 'Completada')
      .reduce((sum, s) => sum + s.total, 0);

    setStats({
      total: salesData.length,
      totalAmount,
      completed,
      cancelled,
    });
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
      Completada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      Cancelada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      Devuelta: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getPaymentMethodBadge = (method) => {
    const badges = {
      Efectivo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      Tarjeta: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      Transferencia: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return badges[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const handleCopyInvoiceNumber = async (invoiceNumber, saleId) => {
    try {
      await navigator.clipboard.writeText(invoiceNumber);
      setCopiedId(saleId);
      toast.success('Número de factura copiado');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  const handleCancelSale = (sale) => {
    if (sale.status === 'Cancelada') {
      toast.error('Esta factura ya está cancelada');
      return;
    }
    setSaleToCancel(sale);
    setShowCancelModal(true);
  };

  const confirmCancelSale = async () => {
    if (!saleToCancel) return;

    try {
      setIsLoading(true);
      await cancelSale(saleToCancel._id);
      toast.success('Factura cancelada exitosamente');
      setShowCancelModal(false);
      setSaleToCancel(null);
      fetchSales(); // Recargar lista
    } catch (error) {
      console.error('Error al cancelar factura:', error);
      toast.error(error.response?.data?.message || 'Error al cancelar factura');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInvoice = (sale) => {
    // Generar código de barras
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, sale.invoiceNumber, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        margin: 0,
        height: 40,
        width: 1.5
      });
    } catch (error) {
      console.error("Error generating barcode:", error);
    }
    const barcodeDataUrl = canvas.toDataURL("image/png");

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Factura ${sale.invoiceNumber}</title>
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
          </style>
        </head>
        <body>
          <h1>${settings.businessName || 'MECANET'}</h1>
          <div class="line"></div>
          
          <div class="info-section">
            <div><strong>Factura:</strong> ${sale.invoiceNumber}</div>
            <div><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</div>
            ${sale.customer ? `<div><strong>Cliente:</strong> ${sale.customer.fullName || sale.customer.name || 'Cliente General'}</div>` : '<div><strong>Cliente:</strong> Cliente General</div>'}
            ${sale.customer?.cedula ? `<div><strong>Cédula:</strong> ${sale.customer.cedula}</div>` : ''}
            ${sale.customer?.phone ? `<div><strong>Teléfono:</strong> ${sale.customer.phone}</div>` : ''}
            ${sale.user ? `<div><strong>Vendedor:</strong> ${sale.user.name || sale.user.username || 'N/A'}</div>` : ''}
          </div>
          
          <div class="line"></div>
          
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
              ${sale.items.map((item, index) => `
                <tr class="item-row">
                  <td>${index + 1}</td>
                  <td>
                    ${item.product?.name || 'Producto'}
                    ${item.product?.warranty ? `<div style="font-size: 10px; font-style: italic; margin-top: 2px;">Garantía: ${item.product.warranty}</div>` : ''}
                  </td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">${formatCurrency(item.subtotal)}</td>
                </tr>
                <tr class="small">
                  <td></td>
                  <td colspan="3">${formatCurrency(item.priceAtSale)} c/u${item.discountApplied > 0 ? ` (-${item.discountApplied}%)` : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="line"></div>
          
          <table>
            <tr>
              <td>Subtotal:</td>
              <td class="right">${formatCurrency(sale.subtotal)}</td>
            </tr>
            ${sale.totalDiscount > 0 ? `
              <tr>
                <td>Descuento:</td>
                <td class="right">-${formatCurrency(sale.totalDiscount)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td>TOTAL:</td>
              <td class="right">${formatCurrency(sale.total)}</td>
            </tr>
            <tr>
              <td colspan="2" class="center small" style="padding-top: 4px;">
                Pago: ${sale.paymentMethod}
              </td>
            </tr>
          </table>
          
          <div class="line"></div>
          
          ${sale.notes ? `
            <div style="margin: 5px 0;">
              <strong>Notas:</strong>
              <p style="margin-top: 2px; white-space: pre-wrap;">${sale.notes}</p>
            </div>
            <div class="line"></div>
          ` : ''}
          
          <div class="line"></div>
          
          <div style="margin-top: 40px; text-align: center;">
            <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 5px;">
              Firma del Vendedor
            </div>
            <div style="font-size: 10px; margin-top: 2px;">
              ${sale.user ? (sale.user.name || sale.user.username || '') : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 15px;">
            <img src="${barcodeDataUrl}" style="width: 100%; max-width: 200px;" />
          </div>

          <p class="center bold" style="margin: 10px 0 3px 0;">¡Gracias por su compra!</p>
          <p class="center small">Este documento no tiene validez fiscal</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    // Esperar a que la imagen se cargue antes de imprimir
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const generateInvoiceHTML = (sale) => {
    // Esta función ya no se usa - ahora usamos el formato de 80mm directamente en handlePrintInvoice
    return '';
  };

  if (isLoading && sales.length === 0) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Historial de Facturas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Consulta y gestiona el historial completo de ventas
        </p>
      </div>

      {/* Estadísticas */}
      {/* Estadísticas */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Ventas"
            value={stats.total}
            icon={ShoppingCart}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monto Total"
            value={formatCurrency(stats.totalAmount)}
            icon={DollarSign}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completadas"
            value={stats.completed}
            icon={TrendingUp}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Canceladas"
            value={stats.cancelled}
            icon={X}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Filtros */}
      {/* Filtros */}
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Buscar factura"
              placeholder="Número de factura..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.status}
                label="Estado"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Completada">Completada</MenuItem>
                <MenuItem value="Cancelada">Cancelada</MenuItem>
                <MenuItem value="Devuelta">Devuelta</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Método de Pago</InputLabel>
              <Select
                value={filters.paymentMethod}
                label="Método de Pago"
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Efectivo">Efectivo</MenuItem>
                <MenuItem value="Tarjeta">Tarjeta</MenuItem>
                <MenuItem value="Transferencia">Transferencia</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Fecha inicio"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Fecha fin"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de Ventas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Factura</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(sales) && sales.map((sale) => (
              <TableRow key={sale._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileText size={16} color="action" />
                    <Typography variant="body2" fontWeight="medium">
                      {sale.invoiceNumber}
                    </Typography>
                    {sale.hasReturns && (
                      <Tooltip title={`${sale.returnsCount} devolución${sale.returnsCount > 1 ? 'es' : ''} • Total: ${formatCurrency(sale.totalReturned || 0)}`}>
                        <Chip
                          label={sale.returnsCount}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ height: 20, minWidth: 20, '& .MuiChip-label': { px: 0.5 } }}
                        />
                      </Tooltip>
                    )}
                    <Tooltip title="Copiar número de factura">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyInvoiceNumber(sale.invoiceNumber, sale._id)}
                      >
                        {copiedId === sale._id ? <Check size={16} color="green" /> : <Copy size={16} />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(sale.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <User size={16} color="action" />
                    <Typography variant="body2">
                      {sale.customer?.fullName || 'Cliente General'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Package size={16} color="action" />
                    <Typography variant="body2">
                      {sale.items?.length || 0}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={sale.paymentMethod}
                    size="small"
                    color={sale.paymentMethod === 'Efectivo' ? 'success' : 'primary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(sale.total)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={sale.status}
                    size="small"
                    color={sale.status === 'Completada' ? 'success' : sale.status === 'Cancelada' ? 'error' : 'warning'}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Ver detalle">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Imprimir">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handlePrintInvoice(sale)}
                      >
                        <Printer size={18} />
                      </IconButton>
                    </Tooltip>
                    {sale.status !== 'Cancelada' && (
                      <Tooltip title="Cancelar factura">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCancelSale(sale)}
                        >
                          <XCircle size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sales.length === 0 && !isLoading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <FileText size={48} color="#9ca3af" style={{ margin: '0 auto', marginBottom: 16 }} />
            <Typography color="text.secondary">
              No se encontraron facturas
            </Typography>
          </Box>
        )}

        {/* Paginación */}
        {!isLoading && pagination.pages > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} facturas
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                startIcon={<ChevronLeft />}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrevPage}
              >
                Anterior
              </Button>
              <Typography variant="body2">
                Página {pagination.page} de {pagination.pages}
              </Typography>
              <Button
                endIcon={<ChevronRight />}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNextPage}
              >
                Siguiente
              </Button>
            </Stack>
          </Box>
        )}
      </TableContainer>

      {/* Modal de Detalle */}
      {showDetailModal && selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSale(null);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusBadge={getStatusBadge}
          getPaymentMethodBadge={getPaymentMethodBadge}
          onPrint={handlePrintInvoice}
          onCancel={handleCancelSale}
        />
      )}

      {/* Modal de Confirmación de Cancelación */}
      {showCancelModal && saleToCancel && (
        <CancelSaleModal
          sale={saleToCancel}
          onConfirm={confirmCancelSale}
          onClose={() => {
            setShowCancelModal(false);
            setSaleToCancel(null);
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

// Modal de Confirmación de Cancelación
const CancelSaleModal = ({ sale, onConfirm, onClose, isLoading }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isLoading]);

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 100000 }}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Cancelar Factura
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>

        {/* Información de la Factura */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Factura:</span>
              <span className="text-base font-bold text-gray-900 dark:text-white">
                #{sale.invoiceNumber}
              </span>
            </div>
            {sale.customer && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Cliente:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {sale.customer.fullName}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                ${sale.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Items:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sale.items.length} producto{sale.items.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Advertencia */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                ¡Importante!
              </h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Al cancelar esta factura:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 space-y-1 list-disc list-inside">
                <li>Se restaurará el stock de todos los productos</li>
                <li>La venta quedará marcada como "Cancelada"</li>
                <li>Esta acción quedará registrada en el sistema</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            No, Mantener
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Cancelando...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Sí, Cancelar Factura
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const getStatusBadge = (status) => {
  const badges = {
    Completada: 'success',
    Cancelada: 'error',
    Devuelta: 'warning',
  };
  return badges[status] || 'default';
};

const getPaymentMethodBadge = (method) => {
  const badges = {
    Efectivo: 'success',
    Tarjeta: 'primary',
    Transferencia: 'secondary',
  };
  return badges[method] || 'default';
};

// Modal de Detalle de Venta
const SaleDetailModal = ({ sale, onClose, formatCurrency, formatDate, getStatusBadge, getPaymentMethodBadge, onPrint, onCancel }) => {
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sale.invoiceNumber);
      setCopied(true);
      toast.success('Número de factura copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 100000 }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="text-blue-600 dark:text-blue-400" />
                Factura #{sale.invoiceNumber}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {formatDate(sale.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card-glass p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400 text-sm">
                <User size={16} />
                Cliente
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {sale.customer?.fullName || 'Cliente General'}
              </p>
              {sale.customer?.cedula && (
                <p className="text-sm text-gray-500">{sale.customer.cedula}</p>
              )}
            </div>
            <div className="card-glass p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400 text-sm">
                <CreditCard size={16} />
                Método de Pago
              </div>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {sale.paymentMethod}
                </p>
                <Chip
                  label={sale.paymentMethod}
                  color={getPaymentMethodBadge(sale.paymentMethod)}
                  size="small"
                  variant="outlined"
                />
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-end mb-4">
            <Chip
              label={sale.status}
              color={getStatusBadge(sale.status)}
              variant="filled"
            />
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Productos
            </h3>
            <div className="space-y-2">
              {sale.items?.map((item, index) => (
                <div key={index} className="card-glass p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.product?.name || 'Producto eliminado'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.totalDiscount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Descuento:</span>
                  <span className="font-medium">-{formatCurrency(sale.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-primary-600 dark:text-primary-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span>Total:</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          {sale.notes && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sale.notes}
              </p>
            </div>
          )}

          {/* Historial de Devoluciones */}
          {sale.hasReturns && sale.returns && sale.returns.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  Historial de Devoluciones ({sale.returnsCount})
                </p>
              </div>
              <div className="space-y-2">
                {sale.returns.map((returnItem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {returnItem.returnNumber}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(returnItem.createdAt)} • {returnItem.items?.length || 0} producto(s) devuelto(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        Reembolso: -{formatCurrency(returnItem.totalAmount || 0)}
                      </p>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${returnItem.status === 'Aprobada' || returnItem.status === 'Completada'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : returnItem.status === 'Rechazada'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                        {returnItem.status === 'Completada' ? 'Aprobada' : returnItem.status || 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {(sale.totalReturned || 0) > 0 && (
                <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800 flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Total Devuelto:
                  </span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(sale.totalReturned || 0)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Vendedor */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vendido por: <span className="font-medium">{sale.user?.name || 'N/A'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const theme = useTheme();

  const getColor = (colorName) => {
    switch (colorName) {
      case 'primary': return theme.palette.primary.main;
      case 'success': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      default: return theme.palette.primary.main;
    }
  };

  const mainColor = getColor(color);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: mainColor }}>
              {value}
            </Typography>
          </Box>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: `${mainColor}20`, // 20% opacity
              color: mainColor,
              width: 48,
              height: 48
            }}
          >
            <Icon size={24} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SalesHistory;
