/**
 * @file Suppliers.jsx
 * @description Gestión de proveedores (CRUD completo)
 * 
 * Responsabilidades:
 * - Listar proveedores con búsqueda
 * - Crear nuevo proveedor (modal, solo admin)
 * - Editar proveedor existente (modal, solo admin)
 * - Eliminar proveedor (con confirmación, solo admin)
 * - Mostrar información de contacto y términos de pago
 * 
 * Estados:
 * - suppliers: Array de proveedores desde backend
 * - filteredSuppliers: Array filtrado por searchTerm
 * - searchTerm: Búsqueda por nombre, RNC, contacto
 * - showModal: Boolean para modal crear/editar
 * - editingSupplier: Proveedor en edición o null para crear
 * 
 * Form Data:
 * - name: Nombre del proveedor (requerido)
 * - contactName: Nombre del contacto
 * - email, phone
 * - address
 * - rnc: RNC del proveedor (único, opcional)
 * - paymentTerms: 'Contado', '15 días', '30 días', '45 días', '60 días'
 * - notes: Notas adicionales
 * 
 * APIs:
 * - GET /api/suppliers
 * - POST /api/suppliers (solo admin)
 * - PUT /api/suppliers/:id (solo admin)
 * - DELETE /api/suppliers/:id (solo admin)
 * 
 * Validaciones:
 * - name requerido
 * - RNC único si se proporciona
 * - Email formato válido si se proporciona
 * 
 * UI Features:
 * - Tabla con skeleton loader
 * - Badge de términos de pago
 * - Modal con formulario completo
 * - Confirmación antes de eliminar
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/api';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/SkeletonLoader';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Save,
  ChevronLeft,
  ChevronRight
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
  CardActions,
  Stack,
  Divider,
  useTheme,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    rnc: '',
    paymentTerms: 'Contado',
    notes: '',
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
    fetchSuppliers();
  }, [pagination.page]);

  useEffect(() => {
    filterSuppliers();
  }, [searchTerm, suppliers]);

  // Cerrar modal con tecla ESC
  useEffect(() => {
    if (showModal) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCloseModal();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showModal]);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await getSuppliers({ page: pagination.page, limit: pagination.limit });

      const suppliersData = response?.data?.suppliers || response?.data || [];
      const paginationData = response?.data?.pagination || {};

      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      toast.error('Error al cargar proveedores');
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSuppliers = () => {
    if (!searchTerm) {
      setFilteredSuppliers(suppliers);
      return;
    }

    const filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.rnc?.includes(searchTerm)
    );
    setFilteredSuppliers(filtered);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre del proveedor es requerido');
      return;
    }

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier._id, formData);
        toast.success('Proveedor actualizado exitosamente');
      } else {
        await createSupplier(formData);
        toast.success('Proveedor creado exitosamente');
      }

      handleCloseModal();
      fetchSuppliers();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      toast.error(error.response?.data?.message || 'Error al guardar proveedor');
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      rnc: supplier.rnc || '',
      paymentTerms: supplier.paymentTerms || 'Contado',
      notes: supplier.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de desactivar este proveedor?')) return;

    try {
      await deleteSupplier(id);
      toast.success('Proveedor desactivado exitosamente');
      fetchSuppliers();
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      toast.error('Error al eliminar proveedor');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      rnc: '',
      paymentTerms: 'Contado',
      notes: '',
    });
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  // Mostrar skeleton mientras carga
  if (isLoading && suppliers.length === 0) {
    return <TableSkeleton rows={8} columns={6} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Proveedores
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona tus proveedores y sus datos de contacto
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setShowModal(true)}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre, email o RNC..."
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

      {/* Suppliers List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </Box>
      ) : filteredSuppliers.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Truck size={64} color="#9ca3af" style={{ margin: '0 auto', marginBottom: 16 }} />
          <Typography variant="h6" gutterBottom>
            {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm
              ? 'Intenta con otro término de búsqueda'
              : 'Comienza agregando tu primer proveedor'}
          </Typography>
          {!searchTerm && (
            <Button variant="contained" startIcon={<Plus />} onClick={() => setShowModal(true)}>
              Agregar Proveedor
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredSuppliers.map((supplier) => (
            <Grid item xs={12} md={6} lg={4} key={supplier._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Truck size={24} />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {supplier.name}
                        </Typography>
                        {supplier.contactName && (
                          <Typography variant="body2" color="text.secondary">
                            {supplier.contactName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Stack spacing={1.5}>
                    {supplier.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Mail size={16} color="gray" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {supplier.email}
                        </Typography>
                      </Box>
                    )}
                    {supplier.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone size={16} color="gray" />
                        <Typography variant="body2" color="text.secondary">
                          {supplier.phone}
                        </Typography>
                      </Box>
                    )}
                    {supplier.address && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapPin size={16} color="gray" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {supplier.address}
                        </Typography>
                      </Box>
                    )}
                    {supplier.rnc && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileText size={16} color="gray" />
                        <Typography variant="body2" color="text.secondary">
                          RNC: {supplier.rnc}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCard size={16} color="gray" />
                      <Typography variant="body2" fontWeight="medium">
                        {supplier.paymentTerms}
                      </Typography>
                    </Box>
                  </Stack>

                  {!supplier.isActive && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" color="error" fontWeight="bold">
                        Inactivo
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(supplier)}
                    sx={{ bgcolor: 'action.hover' }}
                  >
                    <Edit2 size={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(supplier._id)}
                    sx={{ bgcolor: 'error.light', color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Paginación */}
      {!isLoading && pagination.pages > 1 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} proveedores
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
        </Paper>
      )}

      {/* Modal */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre del Proveedor"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ej: Repuestos del Caribe"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Persona de Contacto"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="RNC"
                name="rnc"
                value={formData.rnc}
                onChange={handleChange}
                placeholder="Ej: 123456789"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contacto@proveedor.com"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="809-555-5555"
                inputProps={{ maxLength: 12 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Calle, Número, Sector, Ciudad"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Términos de Pago</InputLabel>
                <Select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  label="Términos de Pago"
                >
                  <MenuItem value="Contado">Contado</MenuItem>
                  <MenuItem value="15 días">15 días</MenuItem>
                  <MenuItem value="30 días">30 días</MenuItem>
                  <MenuItem value="45 días">45 días</MenuItem>
                  <MenuItem value="60 días">60 días</MenuItem>
                  <MenuItem value="90 días">90 días</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Información adicional sobre el proveedor..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<Save />}>
            {editingSupplier ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Suppliers;
