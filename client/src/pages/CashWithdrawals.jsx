import { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Trash2,
  AlertCircle,
  Calendar,
  User,
  FileText,
  TrendingDown,
  Receipt
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getCashWithdrawals,
  createCashWithdrawal,
  updateCashWithdrawalStatus,
  deleteCashWithdrawal
} from '../services/api';
import { useAuthStore } from '../store/authStore';
import { TableSkeleton } from '../components/SkeletonLoader';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  useTheme,
  Tooltip,
  Checkbox,
  FormControlLabel
} from '@mui/material';

const CashWithdrawals = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const canAuthorizeWithdrawals = ['admin', 'desarrollador'].includes(user?.role);
  const [withdrawals, setWithdrawals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchWithdrawals();
  }, [filters]);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      const response = await getCashWithdrawals(filters);
      setWithdrawals(response.data.withdrawals || []);
      setSummary(response.data.summary || null);
    } catch (error) {
      console.error('Error al cargar retiros:', error);
      toast.error('Error al cargar retiros');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWithdrawal = async (data) => {
    try {
      await createCashWithdrawal(data);
      toast.success('Retiro registrado exitosamente');
      setShowCreateModal(false);
      fetchWithdrawals();
    } catch (error) {
      console.error('Error al crear retiro:', error);
      toast.error(error.response?.data?.message || 'Error al crear retiro');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('¿Aprobar este retiro?')) return;

    try {
      await updateCashWithdrawalStatus(id, { status: 'approved' });
      toast.success('Retiro aprobado');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error al aprobar:', error);
      toast.error(error.response?.data?.message || 'Error al aprobar retiro');
    }
  };

  const handleReject = async (id) => {
    const notes = window.prompt('Razón del rechazo:');
    if (!notes) return;

    try {
      await updateCashWithdrawalStatus(id, { status: 'rejected', notes });
      toast.success('Retiro rechazado');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error al rechazar:', error);
      toast.error(error.response?.data?.message || 'Error al rechazar retiro');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este retiro permanentemente?')) return;

    try {
      await deleteCashWithdrawal(id);
      toast.success('Retiro eliminado');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar retiro');
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={16} />,
      approved: <CheckCircle size={16} />,
      rejected: <XCircle size={16} />,
    };
    return icons[status] || <Clock size={16} />;
  };

  const getCategoryLabel = (category) => {
    const categories = {
      personal: 'Personal',
      business: 'Negocio',
      supplier: 'Proveedor',
      other: 'Otro'
    };
    return categories[category] || category;
  };

  if (isLoading && withdrawals.length === 0) {
    return <TableSkeleton rows={8} columns={6} />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Retiros de Caja
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión de retiros y gastos de efectivo
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setShowCreateModal(true)}
        >
          Nuevo Retiro
        </Button>
      </Box>

      {/* Stats Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Retiros</Typography>
                    <Typography variant="h4" fontWeight="bold">{summary.total}</Typography>
                  </Box>
                  <Receipt size={32} color={theme.palette.primary.main} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Monto Total</Typography>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {formatCurrency(summary.totalAmount)}
                    </Typography>
                  </Box>
                  <TrendingDown size={32} color={theme.palette.error.main} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Pendientes</Typography>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {summary.byStatus.pending}
                    </Typography>
                  </Box>
                  <Clock size={32} color={theme.palette.warning.main} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Aprobados</Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {summary.byStatus.approved}
                    </Typography>
                  </Box>
                  <CheckCircle size={32} color={theme.palette.success.main} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.status}
                label="Estado"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">Todos los estados</MenuItem>
                <MenuItem value="pending">Pendientes</MenuItem>
                <MenuItem value="approved">Aprobados</MenuItem>
                <MenuItem value="rejected">Rechazados</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filters.category}
                label="Categoría"
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <MenuItem value="">Todas las categorías</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="business">Negocio</MenuItem>
                <MenuItem value="supplier">Proveedor</MenuItem>
                <MenuItem value="other">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha Inicio"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha Fin"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Razón</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Retirado por</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {withdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: 0.5 }}>
                    <AlertCircle size={48} />
                    <Typography>No hay retiros registrados</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {withdrawal.withdrawalNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(withdrawal.withdrawalDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="error.main">
                      {formatCurrency(withdrawal.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap title={withdrawal.reason}>
                      {withdrawal.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={getCategoryLabel(withdrawal.category)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <User size={16} color={theme.palette.text.secondary} />
                      <Typography variant="body2">
                        {withdrawal.withdrawnBy?.fullName || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(withdrawal.status)}
                      label={getStatusLabel(withdrawal.status)}
                      color={getStatusColor(withdrawal.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>

                      {canAuthorizeWithdrawals && withdrawal.status === 'pending' && (
                        <>
                          <Tooltip title="Aprobar">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(withdrawal._id)}
                            >
                              <CheckCircle size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rechazar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleReject(withdrawal._id)}
                            >
                              <XCircle size={18} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {canAuthorizeWithdrawals && (
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(withdrawal._id)}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Modal */}
      <CreateWithdrawalModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateWithdrawal}
      />

      {/* Detail Modal */}
      <WithdrawalDetailModal
        open={showDetailModal}
        withdrawal={selectedWithdrawal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedWithdrawal(null);
        }}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
        getStatusIcon={getStatusIcon}
        getCategoryLabel={getCategoryLabel}
      />
    </Container>
  );
};

// Create Withdrawal Modal Component
const CreateWithdrawalModal = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    category: 'other',
    notes: '',
    receiptAttached: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.reason) {
      toast.error('Monto y razón son requeridos');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount),
      });
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nuevo Retiro de Caja</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              label="Monto"
              type="number"
              fullWidth
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              placeholder="0.00"
            />

            <TextField
              label="Razón del retiro"
              fullWidth
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ej: Compra de materiales"
            />

            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formData.category}
                label="Categoría"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <MenuItem value="other">Otro</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="business">Negocio</MenuItem>
                <MenuItem value="supplier">Proveedor</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notas adicionales"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Información adicional (opcional)"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.receiptAttached}
                  onChange={(e) => setFormData({ ...formData, receiptAttached: e.target.checked })}
                  color="primary"
                />
              }
              label="Tengo comprobante adjunto"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Registrar Retiro'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Detail Modal Component
const WithdrawalDetailModal = ({ open, withdrawal, onClose, formatCurrency, formatDate, getStatusColor, getStatusLabel, getStatusIcon, getCategoryLabel }) => {
  if (!withdrawal) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Detalle de Retiro
        <IconButton onClick={onClose} size="small">
          <XCircle size={24} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Número de Retiro</Typography>
              <Typography variant="h6">{withdrawal.withdrawalNumber}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Estado</Typography>
              <Box mt={0.5}>
                <Chip
                  icon={getStatusIcon(withdrawal.status)}
                  label={getStatusLabel(withdrawal.status)}
                  color={getStatusColor(withdrawal.status)}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Monto</Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {formatCurrency(withdrawal.amount)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Categoría</Typography>
              <Typography variant="body1">{getCategoryLabel(withdrawal.category)}</Typography>
            </Grid>
          </Grid>

          <Box>
            <Typography variant="caption" color="text.secondary">Razón del Retiro</Typography>
            <Typography variant="body1">{withdrawal.reason}</Typography>
          </Box>

          {withdrawal.notes && (
            <Box>
              <Typography variant="caption" color="text.secondary">Notas</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="body2">{withdrawal.notes}</Typography>
              </Paper>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Fecha de Retiro</Typography>
              <Typography variant="body1">{formatDate(withdrawal.withdrawalDate)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Comprobante</Typography>
              <Typography variant="body1">
                {withdrawal.receiptAttached ? '✅ Adjuntado' : '❌ No adjuntado'}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Retirado por</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {withdrawal.withdrawnBy?.fullName || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {withdrawal.withdrawnBy?.email || ''}
                </Typography>
              </Grid>
              {withdrawal.authorizedBy && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Autorizado por</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {withdrawal.authorizedBy?.fullName || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {withdrawal.authorizedBy?.email || ''}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CashWithdrawals;
