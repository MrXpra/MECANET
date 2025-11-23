/**
 * @file PurchaseOrders.jsx
 * @description Gestión de órdenes de compra (manual y automática)
 * 
 * Responsabilidades:
 * - Listar órdenes de compra con filtros (status, supplier, fechas)
 * - Crear orden manual (modal con selección de productos)
 * - Generar órdenes automáticas basadas en stock bajo (solo admin)
 * - Ver detalle de orden (modal)
 * - Cambiar status de orden: Pendiente → Confirmada → Recibida (solo admin)
 * - Editar orden (solo Pendiente, solo admin)
 * - Eliminar orden (solo admin)
 * - Imprimir orden
 * 
 * Estados:
 * - orders: Array de órdenes desde backend
 * - suppliers: Array de proveedores (para dropdown)
 * - products: Array de productos (para crear orden)
 * - filters: { status, supplierId, startDate, endDate, search }
 * - showCreateModal: Boolean para modal crear
 * - showDetailModal: Boolean para modal detalle
 * - editingOrder: Orden en edición o null
 * - orderItems: Array de items { product, quantity, price } en modal
 * 
 * APIs:
 * - GET /api/purchase-orders
 * - POST /api/purchase-orders (crear manual)
 * - POST /api/purchase-orders/generate-auto (crear automático, solo admin)
 * - PUT /api/purchase-orders/:id (editar, solo admin)
 * - PUT /api/purchase-orders/:id/status (cambiar status, solo admin)
 * - DELETE /api/purchase-orders/:id (solo admin)
 * 
 * Status Flow:
 * 1. Pendiente: Orden creada, esperando confirmación
 * 2. Confirmada: Orden confirmada con proveedor, esperando recepción
 * 3. Recibida: Productos recibidos, stock actualizado automáticamente
 * 4. Cancelada: Orden cancelada
 * 
 * Generación Automática:
 * - Analiza productos con stock < minStock
 * - Agrupa por supplier
 * - Crea una orden por supplier con productos bajo stock
 * - Cantidad sugerida: minStock * 2
 * 
 * UI Features:
 * - Tabla con skeleton loader
 * - Badge de status con colores
 * - Filtros expandibles
 * - Modal de creación con búsqueda de productos
 * - Confirmación antes de cambiar status o eliminar
 * - Impresión de orden (window.print)
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Divider,
  useTheme,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox
} from '@mui/material';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  generateAutoPurchaseOrder,
  updatePurchaseOrder,
  updateOrderStatus,
  sendPurchaseOrderEmail,
  deletePurchaseOrder,
  getSuppliers,
  getProducts,
  getSettings,
} from '../services/api';
import toast from 'react-hot-toast';
import { PurchaseOrdersSkeleton } from '../components/SkeletonLoader';
import { useSettingsStore } from '../store/settingsStore';
import { useProductStore } from '../store/productStore';
import {
  ClipboardList,
  Plus,
  Search,
  Eye,
  Check,
  X,
  Truck,
  Package,
  Calendar,
  DollarSign,
  Zap,
  Printer,
  Edit,
  Trash2,
  AlertTriangle,
  Info,
  Send,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// StatCard Component
const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography color="text.secondary" variant="subtitle2" fontWeight="medium">
          {title}
        </Typography>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>
          <Icon size={20} />
        </Avatar>
      </Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
        {value}
      </Typography>
      {subValue && (
        <Typography variant="body2" color="text.secondary">
          {subValue}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const PurchaseOrders = () => {
  const location = useLocation();
  const { settings: globalSettings } = useSettingsStore();
  const { invalidateCache } = useProductStore();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receivingOrder, setReceivingOrder] = useState(null);
  const requireReception = globalSettings.requireOrderReception !== false;
  const emailFeatureEnabled = settings?.smtp?.enabled ?? globalSettings?.smtp?.enabled ?? true;

  // Estados para modales de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [orderToEmail, setOrderToEmail] = useState(null);

  useEffect(() => {
    fetchData();

    // Check if auto=true in URL y si la función está habilitada
    const params = new URLSearchParams(location.search);
    if (params.get('auto') === 'true' && globalSettings.autoCreatePurchaseOrders) {
      setShowAutoModal(true);
    }
  }, [location, globalSettings.autoCreatePurchaseOrders]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  // Cerrar modales con tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAutoModal) setShowAutoModal(false);
        if (showCreateModal) setShowCreateModal(false);
        if (showEditModal) {
          setShowEditModal(false);
          setEditingOrder(null);
        }
        if (showReceiveModal) {
          setShowReceiveModal(false);
          setReceivingOrder(null);
        }
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setOrderToDelete(null);
        }
        if (showEmailModal) {
          setShowEmailModal(false);
          setOrderToEmail(null);
        }
        if (selectedOrder) setSelectedOrder(null);
      }
    };

    if (showAutoModal || showCreateModal || showEditModal || showReceiveModal || selectedOrder) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showAutoModal, showCreateModal, showEditModal, showReceiveModal, selectedOrder]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, suppliersRes, productsRes, settingsRes] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers({ limit: 1000 }),
        getProducts({ limit: 1000 }),
        getSettings(),
      ]);

      const ordersData = ordersRes?.data || [];
      const suppliersData = suppliersRes?.data?.suppliers || suppliersRes?.data || [];
      const productsData = productsRes?.data?.products || productsRes?.data || [];

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setSettings(settingsRes?.data || settingsRes);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData.filter(s => s.isActive) : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
      setOrders([]);
      setSuppliers([]);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.genericSupplierName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const theme = useTheme();

  const getStatusColor = (status) => {
    const colors = {
      Pendiente: 'warning',
      Enviada: 'info',
      'Recibida Parcial': 'secondary',
      Recibida: 'success',
      Cancelada: 'error',
    };
    return colors[status] || 'default';
  };

  const handleGenerateAuto = async (config) => {
    try {
      const loadingToast = toast.loading('Generando órdenes de compra...');
      const response = await generateAutoPurchaseOrder(config);
      toast.dismiss(loadingToast);
      toast.success(response.data.message || `${response.data.orders?.length || 0} órdenes generadas exitosamente`);
      setShowAutoModal(false);
      fetchData();
    } catch (error) {
      console.error('Error al generar órdenes:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al generar órdenes';
      toast.error(errorMessage, { duration: 5000 });
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    // Si es "Recibida", abrir modal de confirmación solo si la recepción está habilitada
    if (newStatus === 'Recibida' && requireReception) {
      const order = orders.find(o => o._id === orderId);
      setReceivingOrder(order);
      setShowReceiveModal(true);
      return;
    }

    // Para otros estados, actualizar directamente
    try {
      await updateOrderStatus(orderId, {
        status: newStatus,
        receivedDate: null,
      });

      if (newStatus === 'Recibida') {
        invalidateCache();
      }

      toast.success('Estado actualizado correctamente');
      fetchData();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleConfirmReceive = async (orderId, receivedQuantities, receiveNotes) => {
    try {
      // Obtener la orden actual para procesar las cantidades
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        toast.error('Orden no encontrada');
        return;
      }

      // Verificar discrepancias
      const discrepancies = [];
      order.items.forEach(item => {
        const itemId = item._id || item.product?._id;
        const receivedQty = receivedQuantities[itemId] || 0;
        const orderedQty = item.quantity;

        if (receivedQty !== orderedQty) {
          discrepancies.push({
            product: item.product?.name || 'Producto',
            ordered: orderedQty,
            received: receivedQty,
            difference: receivedQty - orderedQty,
          });
        }
      });

      // Preparar notas con información de discrepancias
      let finalNotes = receiveNotes || '';
      if (discrepancies.length > 0) {
        finalNotes += '\n\n--- Discrepancias en Recepción ---\n';
        discrepancies.forEach(disc => {
          finalNotes += `${disc.product}: Pedido ${disc.ordered}, Recibido ${disc.received} (${disc.difference > 0 ? '+' : ''}${disc.difference})\n`;
        });
      }

      await updateOrderStatus(orderId, {
        status: 'Recibida',
        receivedDate: new Date(),
        receivedQuantities,
        receiveNotes: finalNotes,
      });

      // Invalidar caché de productos para que el inventario se actualice
      invalidateCache();

      if (discrepancies.length > 0) {
        toast.success(`Orden recibida con ${discrepancies.length} discrepancia(s) registrada(s)`, {
          duration: 4000,
        });
      } else {
        toast.success('Orden recibida correctamente - Todas las cantidades coinciden');
      }

      setShowReceiveModal(false);
      setReceivingOrder(null);
      fetchData();
    } catch (error) {
      console.error('Error al recibir orden:', error);
      toast.error('Error al recibir orden');
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowEditModal(true);
  };

  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      await deletePurchaseOrder(orderToDelete._id);
      toast.success('Orden eliminada correctamente');
      setShowDeleteModal(false);
      setOrderToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar orden');
    }
  };

  const handleSendEmail = (order) => {
    if (!emailFeatureEnabled) {
      toast.error('El envío de correos está desactivado desde Configuración > Email.');
      return;
    }
    // Validar que el proveedor tenga email
    if (!order.supplier?.email) {
      toast.error('El proveedor no tiene email configurado. Por favor, actualiza los datos del proveedor.');
      return;
    }

    setOrderToEmail(order);
    setShowEmailModal(true);
  };

  const confirmSendEmail = async () => {
    if (!orderToEmail) return;
    if (!emailFeatureEnabled) {
      toast.error('El envío de correos está desactivado. Actívalo en Configuración > Email.');
      setShowEmailModal(false);
      setOrderToEmail(null);
      return;
    }

    try {
      setShowEmailModal(false);
      toast.loading('Enviando email con PDF adjunto...', { id: 'sending-email' });
      const response = await sendPurchaseOrderEmail(orderToEmail._id);
      toast.dismiss('sending-email');
      toast.success(response.data.message || `Email enviado a ${orderToEmail.supplier.email}`);
      setOrderToEmail(null);
      fetchData(); // Recargar para actualizar el campo emailSent
    } catch (error) {
      console.error('Error al enviar email:', error);
      toast.dismiss('sending-email');
      toast.error(error.response?.data?.message || 'Error al enviar email');
      setOrderToEmail(null);
    }
  };

  const handlePrint = (order) => {
    const printWindow = window.open('', '_blank');
    const companyName = settings?.businessName || globalSettings?.businessName || 'MECANET';
    const logoUrl = settings?.businessLogoUrl || globalSettings?.businessLogoUrl || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orden de Compra ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .logo { max-width: 150px; max-height: 80px; margin-bottom: 10px; }
            .company-name { font-size: 24px; font-weight: bold; color: #333; margin: 10px 0; }
            .info { margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .info-box { padding: 10px; background-color: #f9f9f9; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; margin-top: 20px; }
            .notes { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #333; }
            .notes-title { font-weight: bold; margin-bottom: 10px; }
            @media print {
              body { padding: 10px; }
              .header { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ''}
            <div class="company-name">${companyName}</div>
            <h2 style="margin: 10px 0; color: #666;">Orden de Compra</h2>
            <h3 style="margin: 5px 0;">${order.orderNumber}</h3>
          </div>
          
          <div class="info-grid">
            <div class="info-box">
              <p><strong>Proveedor:</strong></p>
              <p>${order.supplier?.name || order.genericSupplierName || 'Proveedor Genérico'}</p>
              ${order.supplier?.phone ? `<p><strong>Teléfono:</strong> ${order.supplier.phone}</p>` : ''}
              ${order.supplier?.email ? `<p><strong>Email:</strong> ${order.supplier.email}</p>` : ''}
            </div>
            <div class="info-box">
              <p><strong>Fecha de Orden:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
              ${order.expectedDeliveryDate ? `<p><strong>Entrega Esperada:</strong> ${new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>` : ''}
              <p><strong>Estado:</strong> <span style="color: ${order.status === 'Recibida' ? 'green' : order.status === 'Cancelada' ? 'red' : 'orange'};">${order.status}</span></p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product?.sku || 'N/A'}</td>
                  <td>
                    ${item.product?.name || 'Producto eliminado'}
                    ${item.product?.brand ? `<br/><small style="color: #666;">${item.product.brand}</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td>$${item.subtotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <p>Subtotal: $${order.subtotal.toFixed(2)}</p>
            <p>ITBIS (18%): $${order.tax.toFixed(2)}</p>
            <p style="font-size: 18px; margin-top: 10px;"><strong>Total: $${order.total.toFixed(2)}</strong></p>
          </div>
          
          ${order.notes ? `
            <div class="notes">
              <div class="notes-title">Notas:</div>
              <div>${order.notes}</div>
            </div>
          ` : ''}
          
          <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
            <p>Documento generado el ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Mostrar skeleton mientras carga
  if (isLoading && orders.length === 0) {
    return <PurchaseOrdersSkeleton />;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Órdenes de Compra
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona las órdenes de compra a proveedores
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          {globalSettings.autoCreatePurchaseOrders && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Zap />}
              onClick={() => setShowAutoModal(true)}
            >
              Generar Automática
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => setShowCreateModal(true)}
          >
            Nueva Orden
          </Button>
        </Stack>
      </Box>

      {!emailFeatureEnabled && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          El envío de emails está desactivado. Activa el SMTP en Configuración &gt; Negocio para poder enviar órdenes a los proveedores.
        </Alert>
      )}

      {!requireReception && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Recepción manual desactivada. Las órdenes pueden marcarse como recibidas sin capturar cantidades ni fecha de recepción.
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Órdenes"
            value={orders.length}
            icon={ClipboardList}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pendientes"
            value={orders.filter((o) => o.status === 'Pendiente').length}
            icon={Calendar}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recibidas"
            value={orders.filter((o) => o.status === 'Recibida').length}
            icon={Check}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Invertido"
            value={`$${orders.filter(o => o.status === 'Recibida').reduce((sum, o) => sum + o.total, 0).toFixed(2)}`}
            icon={DollarSign}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar por número de orden o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Enviada">Enviada</MenuItem>
                <MenuItem value="Recibida Parcial">Recibida Parcial</MenuItem>
                <MenuItem value="Recibida">Recibida</MenuItem>
                <MenuItem value="Cancelada">Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <ClipboardList size={64} style={{ margin: '0 auto', marginBottom: 16, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            {searchTerm || statusFilter !== 'all'
              ? 'No se encontraron órdenes'
              : 'No hay órdenes de compra'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta con otros filtros'
              : 'Comienza creando tu primera orden o genera una automática'}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<Zap />}
              onClick={() => setShowAutoModal(true)}
            >
              Generar Automática
            </Button>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={() => setShowCreateModal(true)}
            >
              Nueva Orden
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Stack spacing={4}>
          {/* Active Orders */}
          {(() => {
            const activeOrders = filteredOrders.filter(o =>
              ['Pendiente', 'Enviada', 'Recibida Parcial'].includes(o.status)
            );
            return activeOrders.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Package size={20} />
                    Órdenes Activas ({activeOrders.length})
                  </Typography>
                  <Divider sx={{ flex: 1 }} />
                </Box>
                <Grid container spacing={3}>
                  {activeOrders.map((order) => (
                    <Grid item xs={12} key={order._id}>
                      <Card>
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant="h6" fontWeight="bold">
                                  {order.orderNumber}
                                </Typography>
                                <Chip
                                  label={order.status}
                                  color={getStatusColor(order.status)}
                                  size="small"
                                />
                              </Box>
                              <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                  <Truck size={16} />
                                  <Typography variant="body2">
                                    {order.supplier?.name || order.genericSupplierName || 'Proveedor Genérico'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                  <Calendar size={16} />
                                  <Typography variant="body2">
                                    {new Date(order.orderDate).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Package size={16} />
                                <Typography variant="body2" fontWeight="medium">
                                  {order.items.length} producto(s)
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <Chip
                                    key={idx}
                                    label={`${item.quantity}x ${item.product?.name || 'Producto'}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                                {order.items.length > 3 && (
                                  <Chip label={`+${order.items.length - 3} más`} size="small" variant="outlined" />
                                )}
                              </Stack>
                            </Grid>
                            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                              <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
                                ${order.total.toFixed(2)}
                              </Typography>
                              <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                {order.status === 'Pendiente' && requireReception && (
                                  <>
                                    <Tooltip title="Marcar orden como enviada al proveedor">
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="info"
                                        startIcon={<Send size={16} />}
                                        onClick={() => handleUpdateStatus(order._id, 'Enviada')}
                                      >
                                        Enviar
                                      </Button>
                                    </Tooltip>
                                    <Tooltip title="Marcar como recibida">
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={<Package size={16} />}
                                        onClick={() => handleUpdateStatus(order._id, 'Recibida')}
                                      >
                                        Recibir
                                      </Button>
                                    </Tooltip>
                                  </>
                                )}
                                {order.status === 'Pendiente' && !requireReception && (
                                  <Tooltip title="Finalizar orden">
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      startIcon={<Package size={16} />}
                                      onClick={() => handleUpdateStatus(order._id, 'Recibida')}
                                    >
                                      Finalizar
                                    </Button>
                                  </Tooltip>
                                )}
                                {order.status === 'Enviada' && (
                                  <Tooltip title={requireReception ? "Marcar como recibida" : "Finalizar orden"}>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      startIcon={<Package size={16} />}
                                      onClick={() => handleUpdateStatus(order._id, 'Recibida')}
                                    >
                                      {requireReception ? 'Marcar Recibida' : 'Finalizar'}
                                    </Button>
                                  </Tooltip>
                                )}

                                <Tooltip title="Imprimir">
                                  <IconButton size="small" onClick={() => handlePrint(order)}>
                                    <Printer size={18} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={order.emailSent ? "Reenviar Email" : "Enviar Email"}>
                                  <IconButton
                                    size="small"
                                    color={order.emailSent ? "success" : "default"}
                                    onClick={() => handleSendEmail(order)}
                                    disabled={!order.supplier?.email || !emailFeatureEnabled}
                                  >
                                    <Mail size={18} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Ver detalles">
                                  <IconButton size="small" onClick={() => setSelectedOrder(order)}>
                                    <Eye size={18} />
                                  </IconButton>
                                </Tooltip>
                                {order.status === 'Pendiente' && (
                                  <>
                                    <Tooltip title="Editar">
                                      <IconButton size="small" onClick={() => handleEditOrder(order)}>
                                        <Edit size={18} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                      <IconButton size="small" color="error" onClick={() => handleDeleteOrder(order)}>
                                        <Trash2 size={18} />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Stack>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })()}

          {/* Completed Orders */}
          {(() => {
            const completedOrders = filteredOrders.filter(o =>
              ['Recibida', 'Cancelada'].includes(o.status)
            );
            return completedOrders.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <Check size={20} />
                    Órdenes Completadas ({completedOrders.length})
                  </Typography>
                  <Divider sx={{ flex: 1 }} />
                </Box>
                <Grid container spacing={3} sx={{ opacity: 0.8 }}>
                  {completedOrders.map((order) => (
                    <Grid item xs={12} key={order._id}>
                      <Card>
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant="h6" fontWeight="bold">
                                  {order.orderNumber}
                                </Typography>
                                <Chip
                                  label={order.status}
                                  color={getStatusColor(order.status)}
                                  size="small"
                                />
                              </Box>
                              <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                  <Truck size={16} />
                                  <Typography variant="body2">
                                    {order.supplier?.name || order.genericSupplierName || 'Proveedor Genérico'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                  <Calendar size={16} />
                                  <Typography variant="body2">
                                    {new Date(order.orderDate).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Package size={16} />
                                <Typography variant="body2" fontWeight="medium">
                                  {order.items.length} producto(s)
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <Chip
                                    key={idx}
                                    label={`${item.quantity}x ${item.product?.name || 'Producto'}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                                {order.items.length > 3 && (
                                  <Chip label={`+${order.items.length - 3} más`} size="small" variant="outlined" />
                                )}
                              </Stack>
                            </Grid>
                            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                              <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>
                                ${order.total.toFixed(2)}
                              </Typography>
                              <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                <Tooltip title="Imprimir">
                                  <IconButton size="small" onClick={() => handlePrint(order)}>
                                    <Printer size={18} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Ver detalles">
                                  <IconButton size="small" onClick={() => setSelectedOrder(order)}>
                                    <Eye size={18} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })()}
        </Stack>
      )}

      {/* Auto Order Modal - Lo crearemos después */}
      {showAutoModal && (
        <AutoOrderModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowAutoModal(false)}
          onGenerate={handleGenerateAuto}
        />
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <CreateOrderModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <CreateOrderModal
          suppliers={suppliers}
          products={products}
          editingOrder={editingOrder}
          onClose={() => {
            setShowEditModal(false);
            setEditingOrder(null);
          }}
          onSave={() => {
            setShowEditModal(false);
            setEditingOrder(null);
            fetchData();
          }}
        />
      )}

      {/* Order Details Modal - Lo crearemos después */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Receive Order Confirmation Modal */}
      {showReceiveModal && receivingOrder && (
        <ReceiveOrderModal
          order={receivingOrder}
          onClose={() => {
            setShowReceiveModal(false);
            setReceivingOrder(null);
          }}
          onConfirm={handleConfirmReceive}
        />
      )}

      {/* Delete Confirmation Modal */}


      {/* Modals */}
      {showAutoModal && (
        <AutoOrderModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowAutoModal(false)}
          onGenerate={handleGenerateAuto}
        />
      )}

      {showCreateModal && (
        <CreateOrderModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

      {showEditModal && editingOrder && (
        <CreateOrderModal
          suppliers={suppliers}
          products={products}
          editingOrder={editingOrder}
          onClose={() => {
            setShowEditModal(false);
            setEditingOrder(null);
          }}
          onSave={() => {
            setShowEditModal(false);
            setEditingOrder(null);
            fetchData();
          }}
        />
      )}

      {showDetailModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {showReceiveModal && receivingOrder && (
        <ReceiveOrderModal
          order={receivingOrder}
          onClose={() => {
            setShowReceiveModal(false);
            setReceivingOrder(null);
          }}
          onConfirm={handleConfirmReceive}
        />
      )}

      {showEmailModal && orderToEmail && (
        <EmailOrderModal
          order={orderToEmail}
          emailFeatureEnabled={emailFeatureEnabled}
          onClose={() => {
            setShowEmailModal(false);
            setOrderToEmail(null);
          }}
          onConfirm={confirmSendEmail}
        />
      )}

      {showDeleteModal && orderToDelete && (
        <DeleteOrderModal
          order={orderToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setOrderToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </Box>
  );
};

// Sub-componentes (modales)
const AutoOrderModal = ({ suppliers, products, onClose, onGenerate }) => {
  const [config, setConfig] = useState({
    supplierId: '',
    productIds: [],
  });

  // Filtrar productos con stock bajo (incluir los que NO tienen proveedor)
  const lowStockProducts = products.filter(p => {
    const isLowStock = p.stock <= p.lowStockThreshold;

    if (!config.supplierId) return isLowStock; // Mostrar todos los productos con stock bajo

    // Si hay proveedor seleccionado, filtrar por ese proveedor
    const productSupplierId = p.supplier?._id || p.supplier;
    return isLowStock && productSupplierId === config.supplierId;
  });

  const productsWithoutSupplier = lowStockProducts.filter(p =>
    !p.supplier || (!p.supplier._id && !p.supplier)
  );

  const handleGenerate = () => {
    if (lowStockProducts.length === 0) {
      toast.error('No hay productos con stock bajo');
      return;
    }
    onGenerate(config);
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Zap size={24} color="#eab308" />
          <Typography variant="h6" fontWeight="bold">
            Generar Orden Automática
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Alert severity="info" icon={<Info />}>
            <Typography variant="subtitle2" fontWeight="bold">
              Productos con stock bajo: {lowStockProducts.length}
              {productsWithoutSupplier.length > 0 && (
                <Box component="span" sx={{ color: 'warning.main', ml: 1 }}>
                  ({productsWithoutSupplier.length} sin proveedor)
                </Box>
              )}
            </Typography>
            <Typography variant="body2">
              Se generarán órdenes automáticas agrupadas por proveedor. Los productos sin proveedor se agruparán en una orden genérica.
            </Typography>
          </Alert>

          {productsWithoutSupplier.length > 0 && (
            <Alert severity="warning">
              <Typography variant="subtitle2" fontWeight="bold">
                ℹ️ Nota: {productsWithoutSupplier.length} producto(s) sin proveedor asignado
              </Typography>
              <Typography variant="body2">
                Estos productos se incluirán en una orden con proveedor "Genérico". Puedes asignar proveedores específicos en el inventario.
              </Typography>
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Filtrar por Proveedor (Opcional)</InputLabel>
            <Select
              value={config.supplierId}
              label="Filtrar por Proveedor (Opcional)"
              onChange={(e) => setConfig({ ...config, supplierId: e.target.value })}
            >
              <MenuItem value="">Todos los proveedores</MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Productos a incluir ({lowStockProducts.length})
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              {lowStockProducts.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  No hay productos con stock bajo
                </Box>
              ) : (
                <Stack spacing={0}>
                  {lowStockProducts.map((product, index) => (
                    <Box
                      key={product._id}
                      sx={{
                        p: 2,
                        borderBottom: index < lowStockProducts.length - 1 ? 1 : 0,
                        borderColor: 'divider',
                        bgcolor: 'background.paper'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle2">{product.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', mt: 0.5 }}>
                            <Truck size={12} />
                            <Typography variant="caption">
                              {product.supplier?.name || 'Sin proveedor'}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="subtitle2" color="error.main">
                          Pedir: {Math.max((product.lowStockThreshold * 2) - product.stock, 1)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={2}>
                        <Typography variant="caption" color="text.secondary">
                          Stock: {product.stock}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Mínimo: {product.lowStockThreshold}
                        </Typography>
                        <Typography variant="caption" color="error.main">
                          Déficit: {product.lowStockThreshold - product.stock}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={lowStockProducts.length === 0}
          startIcon={<Zap />}
        >
          Generar Órdenes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Create/Edit Order Modal - Rediseñado
const CreateOrderModal = ({ suppliers, products, editingOrder, onClose, onSave }) => {
  // Estado del carrito
  const [cart, setCart] = useState(editingOrder?.items?.map(item => ({
    product: item.product?._id || item.product,
    productData: item.product,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  })) || []);

  // Estado del formulario
  const [supplier, setSupplier] = useState(editingOrder?.supplier?._id || editingOrder?.supplier || '');
  const [genericSupplierName, setGenericSupplierName] = useState(editingOrder?.genericSupplierName || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    editingOrder?.expectedDeliveryDate
      ? new Date(editingOrder.expectedDeliveryDate).toISOString().split('T')[0]
      : ''
  );
  const [notes, setNotes] = useState(editingOrder?.notes || '');

  // Estado de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, outOfStock, lowStock, normal

  // Productos ordenados y filtrados
  const sortedAndFilteredProducts = products
    .filter(p => {
      // Filtro de búsqueda
      const matchSearch = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de categoría
      const matchCategory = !categoryFilter || p.category === categoryFilter;

      // Filtro de marca
      const matchBrand = !brandFilter || p.brand === brandFilter;

      // Filtro de stock
      let matchStock = true;
      if (stockFilter === 'outOfStock') matchStock = p.stock === 0;
      else if (stockFilter === 'lowStock') matchStock = p.stock > 0 && p.stock <= p.lowStockThreshold;
      else if (stockFilter === 'normal') matchStock = p.stock > p.lowStockThreshold;

      return matchSearch && matchCategory && matchBrand && matchStock;
    })
    .sort((a, b) => {
      // Agotados primero
      if (a.stock === 0 && b.stock !== 0) return -1;
      if (a.stock !== 0 && b.stock === 0) return 1;
      // Stock bajo después
      const aLow = a.stock > 0 && a.stock <= a.lowStockThreshold;
      const bLow = b.stock > 0 && b.stock <= b.lowStockThreshold;
      if (aLow && !bLow) return -1;
      if (!aLow && bLow) return 1;
      // Stock normal al final, ordenado alfabéticamente
      return a.name.localeCompare(b.name);
    });

  // Extraer categorías y marcas únicas
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  // Calcular totales (manejar valores vacíos)
  const subtotal = cart.reduce((sum, item) => {
    const qty = typeof item.quantity === 'number' ? item.quantity : (parseInt(item.quantity) || 0);
    const price = typeof item.unitPrice === 'number' ? item.unitPrice : (parseFloat(item.unitPrice) || 0);
    return sum + (qty * price);
  }, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  // Agregar producto al carrito
  const addToCart = (product) => {
    // Verificar si ya está en el carrito
    const existingItem = cart.find(item => item.product === product._id);
    if (existingItem) {
      toast.info('Este producto ya está en el carrito');
      return;
    }

    // Calcular cantidad óptima:
    // Si tiene reorderPoint definido, llevar hasta ese nivel
    // Si no, usar el doble del lowStockThreshold como stock normal
    const targetStock = product.reorderPoint || (product.lowStockThreshold * 2);
    const optimalQuantity = Math.max(1, targetStock - product.stock);

    const newItem = {
      product: product._id,
      productData: product,
      quantity: optimalQuantity,
      unitPrice: 0, // Precio opcional, el proveedor lo define
    };

    setCart([...cart, newItem]);

    // Auto-seleccionar proveedor si no hay uno seleccionado
    if (!supplier && (product.supplier?._id || product.supplier)) {
      setSupplier(product.supplier?._id || product.supplier);
    }
  };

  // Actualizar cantidad del producto en el carrito
  const updateQuantity = (productId, newQuantity) => {
    // Permitir valores vacíos para que el usuario pueda borrar
    if (newQuantity === '' || newQuantity === null || newQuantity === undefined) {
      setCart(cart.map(item =>
        item.product === productId ? { ...item, quantity: '' } : item
      ));
      return;
    }
    const quantity = parseInt(newQuantity);
    if (!isNaN(quantity) && quantity >= 1) {
      setCart(cart.map(item =>
        item.product === productId ? { ...item, quantity: quantity } : item
      ));
    }
  };

  // Actualizar precio del producto en el carrito
  const updatePrice = (productId, newPrice) => {
    // Permitir valores vacíos para que el usuario pueda borrar
    if (newPrice === '' || newPrice === null || newPrice === undefined) {
      setCart(cart.map(item =>
        item.product === productId ? { ...item, unitPrice: '' } : item
      ));
      return;
    }
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      setCart(cart.map(item =>
        item.product === productId ? { ...item, unitPrice: price } : item
      ));
    }
  };

  // Remover producto del carrito
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product !== productId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplier && !genericSupplierName.trim()) {
      toast.error('Debe especificar un proveedor o ingresar un nombre genérico');
      return;
    }

    if (cart.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    try {
      const orderData = {
        items: cart.map(item => ({
          product: item.product,
          quantity: parseInt(item.quantity),
          unitPrice: item.unitPrice !== '' ? parseFloat(item.unitPrice) : 0,
        })),
        notes,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
      };

      // Solo agregar supplier si se seleccionó uno
      if (supplier) {
        orderData.supplier = supplier;
      }

      // Agregar nombre de proveedor genérico si se escribió
      if (!supplier && genericSupplierName.trim()) {
        orderData.genericSupplierName = genericSupplierName.trim();
      }

      if (editingOrder) {
        await updatePurchaseOrder(editingOrder._id, orderData);
        toast.success('Orden actualizada correctamente');
      } else {
        await createPurchaseOrder(orderData);
        toast.success('Orden creada correctamente');
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar orden:', error);
      toast.error(error.response?.data?.message || 'Error al guardar orden');
    }
  };

  const getStockBadge = (product) => {
    if (product.stock === 0) {
      return { text: 'Agotado', color: 'error' };
    } else if (product.stock <= product.lowStockThreshold) {
      return { text: 'Stock Bajo', color: 'warning' };
    } else {
      return { text: 'Stock OK', color: 'success' };
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Package size={24} color="#2563eb" />
          <Typography variant="h6" fontWeight="bold">
            {editingOrder ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <X />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
          <Grid container sx={{ height: '100%' }}>
            {/* LEFT COLUMN - Product Browser */}
            <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider', p: 2 }}>
              {/* Search and Filters */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Buscar por nombre, SKU o marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={20} />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Categoría"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="">Todas las categorías</MenuItem>
                      {categories.sort().map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Marca</InputLabel>
                    <Select
                      value={brandFilter}
                      label="Marca"
                      onChange={(e) => setBrandFilter(e.target.value)}
                    >
                      <MenuItem value="">Todas las marcas</MenuItem>
                      {brands.sort().map(brand => (
                        <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stock</InputLabel>
                    <Select
                      value={stockFilter}
                      label="Stock"
                      onChange={(e) => setStockFilter(e.target.value)}
                    >
                      <MenuItem value="all">Todo el stock</MenuItem>
                      <MenuItem value="outOfStock">Agotados</MenuItem>
                      <MenuItem value="lowStock">Stock Bajo</MenuItem>
                      <MenuItem value="normal">Stock Normal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Products Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>SKU</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell align="center">Stock Actual</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Precio</TableCell>
                      <TableCell align="center">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedAndFilteredProducts.map((product) => {
                      const badge = getStockBadge(product);
                      const inCart = cart.some(item => item.product === product._id);

                      return (
                        <TableRow key={product._id} hover>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{product.sku}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{product.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{product.brand}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="bold">{product.stock}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              / {product.reorderPoint || (product.lowStockThreshold * 2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={badge.text}
                              color={badge.color}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            ${product.purchasePrice?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant={inCart ? "outlined" : "contained"}
                              color={inCart ? "inherit" : "primary"}
                              disabled={inCart}
                              onClick={() => addToCart(product)}
                              startIcon={<Plus size={16} />}
                            >
                              {inCart ? 'Agregado' : 'Agregar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {sortedAndFilteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No se encontraron productos
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* RIGHT COLUMN - Cart & Form */}
            <Grid item xs={12} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', p: 2 }}>
              <Box sx={{ mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Package size={20} color="#2563eb" />
                <Typography variant="h6">Carrito ({cart.length})</Typography>
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                {cart.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Package size={48} style={{ margin: '0 auto', marginBottom: 8, opacity: 0.5 }} />
                    <Typography variant="body2">No hay productos seleccionados</Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {cart.map((item) => (
                      <Paper key={item.product} variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2">{item.productData.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.productData.sku}</Typography>
                          </Box>
                          <IconButton size="small" color="error" onClick={() => removeFromCart(item.product)}>
                            <X size={16} />
                          </IconButton>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              label="Cantidad"
                              type="number"
                              size="small"
                              fullWidth
                              required
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product, e.target.value)}
                              inputProps={{ min: 1 }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Precio"
                              type="number"
                              size="small"
                              fullWidth
                              value={item.unitPrice}
                              onChange={(e) => updatePrice(item.product, e.target.value)}
                              inputProps={{ min: 0, step: 0.01 }}
                              placeholder="0.00"
                            />
                          </Grid>
                        </Grid>
                        <Box sx={{ mt: 1, textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight="medium">
                            Subtotal: ${((typeof item.quantity === 'number' ? item.quantity : (parseInt(item.quantity) || 0)) * (typeof item.unitPrice === 'number' ? item.unitPrice : (parseFloat(item.unitPrice) || 0))).toFixed(2)}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>

              <Stack spacing={2} sx={{ mt: 'auto' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Proveedor</InputLabel>
                  <Select
                    value={supplier}
                    label="Proveedor"
                    onChange={(e) => {
                      setSupplier(e.target.value);
                      if (e.target.value) setGenericSupplierName('');
                    }}
                  >
                    <MenuItem value="">Proveedor Genérico / Otro</MenuItem>
                    {suppliers.filter(s => s.isActive).map((sup) => (
                      <MenuItem key={sup._id} value={sup._id}>
                        {sup.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {!supplier && (
                  <TextField
                    label="Nombre del Proveedor *"
                    fullWidth
                    size="small"
                    value={genericSupplierName}
                    onChange={(e) => setGenericSupplierName(e.target.value)}
                    placeholder="Ej: Ferreteria Local, Vendedor Juan, etc."
                    required={!supplier}
                  />
                )}

                <TextField
                  label="Fecha de Entrega"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />

                <TextField
                  label="Notas"
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Información adicional..."
                />

                {subtotal > 0 ? (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                      <Typography variant="body2" fontWeight="medium">${subtotal.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">ITBIS (18%):</Typography>
                      <Typography variant="body2" fontWeight="medium">${tax.toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">${total.toFixed(2)}</Typography>
                    </Box>
                  </Paper>
                ) : cart.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="text.secondary">
                      💡 Los precios se definirán con el proveedor
                    </Typography>
                  </Paper>
                )}

                <Stack direction="row" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={cart.length === 0 || (!supplier && !genericSupplierName.trim())}
                    startIcon={<Check />}
                  >
                    {editingOrder ? 'Actualizar' : 'Crear'} Orden
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    onClick={onClose}
                    startIcon={<X />}
                  >
                    Cancelar
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const OrderDetailsModal = ({ order, onClose }) => {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          Detalles de Orden {order.orderNumber}
        </Typography>
        <IconButton onClick={onClose}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Proveedor</Typography>
            <Typography variant="body1" fontWeight="medium">
              {order.supplier?.name || order.genericSupplierName || 'Proveedor Genérico'}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Estado</Typography>
            <Typography variant="body1" fontWeight="medium">{order.status}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Fecha</Typography>
            <Typography variant="body1" fontWeight="medium">
              {new Date(order.orderDate).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">Total</Typography>
            <Typography variant="body1" fontWeight="medium">${order.total.toFixed(2)}</Typography>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>Productos</Typography>
        <Stack spacing={2}>
          {order.items.map((item, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {item.product?.name || 'Producto eliminado'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cantidad: {item.quantity} x ${item.unitPrice.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="subtitle1" fontWeight="bold">
                ${item.subtotal.toFixed(2)}
              </Typography>
            </Paper>
          ))}
        </Stack>

        <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
              <Typography>Subtotal:</Typography>
              <Typography>${order.subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
              <Typography>ITBIS (18%):</Typography>
              <Typography>${order.tax.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold">Total:</Typography>
              <Typography variant="h6" fontWeight="bold">${order.total.toFixed(2)}</Typography>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Receive Order Confirmation Modal
const ReceiveOrderModal = ({ order, onClose, onConfirm }) => {
  const [checkedItems, setCheckedItems] = useState({});
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [notes, setNotes] = useState('');
  const [allChecked, setAllChecked] = useState(false);

  // Inicializar cantidades recibidas con las cantidades pedidas
  useEffect(() => {
    const initialQuantities = {};
    order.items.forEach(item => {
      const itemId = item._id || item.product?._id;
      initialQuantities[itemId] = item.quantity;
    });
    setReceivedQuantities(initialQuantities);
  }, [order.items]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCheckItem = (itemId) => {
    const newCheckedItems = {
      ...checkedItems,
      [itemId]: !checkedItems[itemId],
    };
    setCheckedItems(newCheckedItems);

    // Verificar si todos están marcados
    const allItemsChecked = order.items.every(item => newCheckedItems[item._id || item.product._id]);
    setAllChecked(allItemsChecked);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    // Permitir valores vacíos para que el usuario pueda borrar
    if (newQuantity === '' || newQuantity === null || newQuantity === undefined) {
      setReceivedQuantities({
        ...receivedQuantities,
        [itemId]: '',
      });
      return;
    }
    const quantity = parseInt(newQuantity);
    if (!isNaN(quantity) && quantity >= 0) {
      setReceivedQuantities({
        ...receivedQuantities,
        [itemId]: quantity,
      });
    }
  };

  const handleCheckAll = () => {
    if (allChecked) {
      setCheckedItems({});
      setAllChecked(false);
    } else {
      const newCheckedItems = {};
      order.items.forEach(item => {
        newCheckedItems[item._id || item.product._id] = true;
      });
      setCheckedItems(newCheckedItems);
      setAllChecked(true);
    }
  };

  const handleConfirm = () => {
    if (!allChecked) {
      toast.error('Debe verificar todos los productos antes de confirmar la recepción');
      return;
    }
    onConfirm(order._id, receivedQuantities, notes);
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Package size={24} color="#2563eb" />
            Confirmar Recepción de Orden
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.orderNumber} - {order.supplier?.name || order.genericSupplierName || 'Proveedor Genérico'}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Instrucciones */}
          <Alert severity="info" icon={<AlertTriangle />}>
            <Typography variant="subtitle2" fontWeight="bold">
              Lista de Verificación de Recepción
            </Typography>
            <Typography variant="body2">
              Verifique que cada producto haya sido recibido en la cantidad correcta y en buen estado.
              Marque cada ítem a medida que lo verifique.
            </Typography>
          </Alert>

          {/* Progreso */}
          <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48, fontWeight: 'bold' }}>
                {checkedCount}/{order.items.length}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">Progreso de Verificación</Typography>
                <Typography variant="caption" color="text.secondary">
                  {checkedCount === order.items.length ? '¡Todos los productos verificados!' : `${order.items.length - checkedCount} producto(s) pendiente(s)`}
                </Typography>
              </Box>
            </Box>
            <Button size="small" onClick={handleCheckAll}>
              {allChecked ? 'Desmarcar Todo' : 'Marcar Todo'}
            </Button>
          </Paper>

          {/* Lista de Productos */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Package size={20} />
              Productos en esta Orden
            </Typography>
            <Stack spacing={2}>
              {order.items.map((item, idx) => {
                const itemId = item._id || item.product?._id || idx;
                const isChecked = checkedItems[itemId] || false;
                const receivedQty = receivedQuantities[itemId] !== undefined && receivedQuantities[itemId] !== ''
                  ? receivedQuantities[itemId]
                  : item.quantity;
                const numericReceivedQty = receivedQty === '' ? 0 : (typeof receivedQty === 'number' ? receivedQty : parseInt(receivedQty) || 0);
                const hasDiscrepancy = numericReceivedQty !== item.quantity;

                return (
                  <Paper
                    key={itemId}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderColor: isChecked ? 'success.main' : 'divider',
                      bgcolor: isChecked ? 'success.lighter' : 'background.paper',
                      transition: 'all 0.2s',
                      borderWidth: isChecked ? 2 : 1
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ pt: 0.5 }}>
                        <Checkbox
                          checked={isChecked}
                          onChange={() => handleCheckItem(itemId)}
                          color="success"
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle2">{item.product?.name || 'Producto eliminado'}</Typography>
                            <Typography variant="caption" color="text.secondary">SKU: {item.product?.sku || 'N/A'}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle2">${item.subtotal.toFixed(2)}</Typography>
                            <Typography variant="caption" color="text.secondary">${item.unitPrice.toFixed(2)} c/u</Typography>
                          </Box>
                        </Box>

                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">Cantidad pedida:</Typography>
                              <Chip label={item.quantity} size="small" />
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">Cantidad recibida:</Typography>
                              <TextField
                                type="number"
                                size="small"
                                value={receivedQty}
                                onChange={(e) => handleQuantityChange(itemId, e.target.value)}
                                inputProps={{ min: 0, style: { textAlign: 'center', width: '60px' } }}
                                error={hasDiscrepancy}
                                sx={{ width: '80px' }}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Box>

          <TextField
            label="Notas de Recepción (Opcional)"
            multiline
            rows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comentarios sobre la recepción, estado de los productos, etc."
            sx={{ mt: 3 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="success"
          disabled={!allChecked}
          startIcon={<Check />}
        >
          Confirmar Recepción
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EmailOrderModal = ({ order, emailFeatureEnabled, onClose, onConfirm }) => {
  if (!order) return null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Mail color="#2563eb" />
        Enviar Orden por Email
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Alert severity="info">
            <Typography variant="body2">
              Se enviará un correo electrónico a <strong>{order.supplier?.email}</strong> con la orden de compra adjunta en formato PDF.
            </Typography>
          </Alert>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Detalles del Envío:</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Orden #</Typography>
                <Typography variant="body2">{order.orderNumber}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Proveedor</Typography>
                <Typography variant="body2">{order.supplier?.name}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Total</Typography>
                <Typography variant="body2">${order.total.toFixed(2)}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {!emailFeatureEnabled && (
            <Alert severity="warning">
              El envío de correos está desactivado en la configuración.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={!emailFeatureEnabled}
          startIcon={<Send size={18} />}
        >
          Enviar Email
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteOrderModal = ({ order, onClose, onConfirm }) => {
  if (!order) return null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <AlertTriangle />
        Eliminar Orden de Compra
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Typography>
            ¿Estás seguro de que deseas eliminar la orden <strong>{order.orderNumber}</strong>?
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.lighter', borderColor: 'error.light' }}>
            <Typography variant="subtitle2" color="error.main" gutterBottom>
              ⚠️ Esta acción no se puede deshacer
            </Typography>
            <Typography variant="body2" color="error.dark">
              La orden será eliminada permanentemente del sistema.
            </Typography>
          </Paper>

          <Box>
            <Typography variant="caption" color="text.secondary">Detalles:</Typography>
            <Typography variant="body2">
              Proveedor: {order.supplier?.name || order.genericSupplierName} <br />
              Total: ${order.total.toFixed(2)} <br />
              Fecha: {new Date(order.orderDate).toLocaleDateString()}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          startIcon={<Trash2 size={18} />}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseOrders;
