/**
 * @file Customers.jsx
 * @description Gestión de clientes (CRUD completo + historial de compras)
 * 
 * Responsabilidades:
 * - Listar clientes con búsqueda
 * - Crear nuevo cliente (modal)
 * - Editar cliente existente (modal)
 * - Eliminar cliente (con confirmación, solo admin)
 * - Ver detalle de cliente con historial de compras
 * - Mostrar estadísticas del cliente (total gastado, número de compras)
 * 
 * Estados:
 * - customers: Array de clientes desde backend
 * - filteredCustomers: Array filtrado por searchTerm
 * - searchTerm: Búsqueda por nombre, cédula, teléfono
 * - showCustomerModal: Boolean para modal crear/editar
 * - showDetailModal: Boolean para modal de detalle + historial
 * - editingCustomer: Cliente en edición o null para crear
 * - selectedCustomer: Cliente seleccionado para ver detalle
 * - customerSales: Array de ventas del cliente seleccionado
 * 
 * APIs:
 * - GET /api/customers
 * - POST /api/customers
 * - PUT /api/customers/:id
 * - DELETE /api/customers/:id (solo admin)
 * - GET /api/customers/:id/purchases (historial)
 * 
 * Form Data:
 * - fullName, email, phone
 * - address, city
 * - identificationType: 'Cédula', 'Pasaporte', 'RNC'
 * - identificationNumber
 * 
 * Validaciones:
 * - fullName requerido
 * - identificationType + identificationNumber requeridos
 * - Email opcional pero formato válido
 * - identificationNumber único (sparse index en backend)
 * 
 * UI Features:
 * - Tabla con skeleton loader
 * - Modal de historial con lista de compras y totales
 * - Confirmación antes de eliminar
 * - Tooltips informativos
 */

import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getSales } from '../services/api';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/SkeletonLoader';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Calendar,
  X,
  Check,
  Eye,
  Users,
  TrendingUp,
  DollarSign,
  Info,
  Info,
  ChevronLeft,
  ChevronRight,
  Save
} from 'lucide-react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
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
  Stack,
  Divider,
  useTheme,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [showTooltip, setShowTooltip] = useState(null);

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
    fetchCustomers();
  }, [pagination.page]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  // Cerrar modales con tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showCustomerModal) {
          setShowCustomerModal(false);
          setEditingCustomer(null);
        }
        if (showDetailModal) {
          setShowDetailModal(false);
          setSelectedCustomer(null);
        }
      }
    };

    if (showCustomerModal || showDetailModal) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showCustomerModal, showDetailModal]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await getCustomers({ page: pagination.page, limit: pagination.limit });

      const customersData = response?.data?.customers || response?.data || [];
      const paginationData = response?.data?.pagination || {};

      setCustomers(Array.isArray(customersData) ? customersData : []);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Error al cargar clientes');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.cedula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('¿Está seguro de eliminar este cliente?')) {
      return;
    }

    try {
      await deleteCustomer(customerId);
      toast.success('Cliente eliminado exitosamente');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar cliente');
    }
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer._id, customerData);
        toast.success('Cliente actualizado exitosamente');
      } else {
        await createCustomer(customerData);
        toast.success('Cliente creado exitosamente');
      }
      setShowCustomerModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(error.response?.data?.message || 'Error al guardar cliente');
    }
  };

  const handleViewCustomer = async (customer) => {
    try {
      setSelectedCustomer(customer);
      setShowDetailModal(true);

      // Fetch sales for this customer
      const response = await getSales();
      const customerSalesData = response.data.filter(sale => sale.customer?._id === customer._id);
      setCustomerSales(customerSalesData);
    } catch (error) {
      console.error('Error fetching customer sales:', error);
      toast.error('Error al cargar historial de compras');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalCustomers = () => customers.length;

  const getTotalSales = () => {
    return customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);
  };

  const getActiveCustomers = () => {
    // Clientes con al menos una compra
    return customers.filter(c => c.purchaseHistory && c.purchaseHistory.length > 0).length;
  };

  const getAveragePerCustomer = () => {
    const active = getActiveCustomers();
    return active > 0 ? getTotalSales() / active : 0;
  };

  // Mostrar skeleton mientras carga
  if (isLoading && customers.length === 0) {
    return <TableSkeleton rows={10} columns={7} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Clientes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión de base de datos de clientes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={handleAddCustomer}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Clientes
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {getTotalCustomers()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Users size={24} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Clientes Activos
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {getActiveCustomers()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <ShoppingBag size={24} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ventas Totales
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {formatCurrency(getTotalSales())}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <DollarSign size={24} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Promedio/Cliente
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="secondary.main">
                    {formatCurrency(getAveragePerCustomer())}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <TrendingUp size={24} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre, cédula, teléfono o email..."
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
      </Paper>

      {/* Customers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Cédula</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Compras</TableCell>
              <TableCell>Total Gastado</TableCell>
              <TableCell>Registrado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                        <User size={20} />
                      </Avatar>
                      <Typography variant="body2" fontWeight="medium">
                        {customer.fullName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {customer.cedula || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {customer.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone size={14} color="gray" />
                          <Typography variant="caption" color="text.secondary">
                            {customer.phone}
                          </Typography>
                        </Box>
                      )}
                      {customer.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Mail size={14} color="gray" />
                          <Typography variant="caption" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {customer.address ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapPin size={14} color="gray" />
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                          {customer.address}
                        </Typography>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      <span className="font-bold">{customer.purchaseHistory?.length || 0}</span> compras
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(customer.totalPurchases || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(customer.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCustomer(customer._id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        {!isLoading && pagination.pages > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} clientes
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

      {/* Customer Modal */}
      <Dialog
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <CustomerModal
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          onClose={() => setShowCustomerModal(false)}
        />
      </Dialog>

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          sales={customerSales}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCustomer(null);
            setCustomerSales([]);
          }}
          onEdit={() => {
            setShowDetailModal(false);
            handleEditCustomer(selectedCustomer);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

// Customer Modal Component
const CustomerModal = ({ customer, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: customer?.fullName || '',
    cedula: customer?.cedula || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const formatPhone = (value) => {
    // Remover todo excepto números
    const cleaned = value.replace(/\D/g, '');

    // Limitar a 10 dígitos
    const limited = cleaned.substring(0, 10);

    // Aplicar formato XXX-XXX-XXXX
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };

  const formatCedula = (value) => {
    // Remover todo excepto números
    const cleaned = value.replace(/\D/g, '');

    // Limitar a 11 dígitos
    const limited = cleaned.substring(0, 11);

    // Aplicar formato XXX-XXXXXXX-X
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 10) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 10)}-${limited.slice(10)}`;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Aplicar formato según el campo
    if (name === 'phone') {
      formattedValue = formatPhone(value);
    } else if (name === 'cedula') {
      formattedValue = formatCedula(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre es requerido';
    }

    // Cédula opcional, pero si se proporciona debe ser válida
    if (formData.cedula.trim() && formData.cedula.replace(/\D/g, '').length !== 11) {
      newErrors.cedula = 'La cédula debe tener 11 dígitos';
    }

    // Teléfono opcional, pero si se proporciona debe ser válido
    if (formData.phone.trim() && formData.phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = 'El teléfono debe tener 10 dígitos';
    }

    // Email opcional, pero si se proporciona debe ser válido
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>
        {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre Completo"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                error={!!errors.fullName}
                helperText={errors.fullName}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cédula"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                error={!!errors.cedula}
                helperText={errors.cedula || "001-0123456-7 (opcional)"}
                inputProps={{ style: { fontFamily: 'monospace' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone || "809-555-1234 (opcional)"}
                inputProps={{ style: { fontFamily: 'monospace' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                name="address"
                value={formData.address}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={isLoading ? null : <Save />}
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : (customer ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </>
  );
};

// Customer Detail Modal Component
// Customer Detail Modal Component
const CustomerDetailModal = ({ customer, sales, onClose, onEdit, formatCurrency, formatDate }) => {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 56, height: 56 }}>
            <User size={32} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {customer.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliente desde {formatDate(customer.createdAt)}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Customer Info */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }} variant="outlined">
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Información de Contacto
              </Typography>
              <Stack spacing={1}>
                {customer.cedula && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="span" sx={{ color: 'text.secondary', display: 'flex' }}>
                      <User size={16} />
                    </Box>
                    <Typography variant="body2" fontFamily="monospace">
                      {customer.cedula}
                    </Typography>
                  </Box>
                )}
                {customer.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="span" sx={{ color: 'text.secondary', display: 'flex' }}>
                      <Phone size={16} />
                    </Box>
                    <Typography variant="body2" fontFamily="monospace">
                      {customer.phone}
                    </Typography>
                  </Box>
                )}
                {customer.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="span" sx={{ color: 'text.secondary', display: 'flex' }}>
                      <Mail size={16} />
                    </Box>
                    <Typography variant="body2">
                      {customer.email}
                    </Typography>
                  </Box>
                )}
                {customer.address && (
                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                    <Box component="span" sx={{ color: 'text.secondary', display: 'flex', mt: 0.5 }}>
                      <MapPin size={16} />
                    </Box>
                    <Typography variant="body2">
                      {customer.address}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }} variant="outlined">
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Estadísticas de Compra
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Total de compras:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {sales.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Total gastado:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    {formatCurrency(customer.totalPurchases || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Promedio por compra:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="info.main">
                    {formatCurrency(sales.length > 0 ? (customer.totalPurchases || 0) / sales.length : 0)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Purchase History */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Historial de Compras
          </Typography>

          {sales.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto', marginBottom: 8, opacity: 0.5 }} />
              <Typography>No hay compras registradas</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {sales.map((sale) => (
                <Paper
                  key={sale._id}
                  variant="outlined"
                  sx={{ p: 2, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Factura #{sale.invoiceNumber}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Calendar size={14} color="gray" />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(sale.createdAt)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ShoppingBag size={14} color="gray" />
                          <Typography variant="caption" color="text.secondary">
                            {sale.items.length} artículo(s)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(sale.total)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sale.paymentMethod}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Stack spacing={0.5}>
                    {sale.items.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.quantity}x {item.product?.name || 'Producto'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(item.subtotal)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
        <Button onClick={onEdit} variant="contained" startIcon={<Edit />}>
          Editar Cliente
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Customers;
