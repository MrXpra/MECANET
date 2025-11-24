import { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";
import {
  Shield,
  User,
  Download,
  Trash2,
  Eye,
  Filter,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Search
} from "lucide-react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Pagination,
  InputAdornment,
  useTheme,
  CircularProgress
} from "@mui/material";

const AuditLogs = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [filters, setFilters] = useState({
    module: "",
    action: "",
    severity: "",
    entityType: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(response.data.logs || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error al cargar logs de auditoría:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error al cargar logs";
      toast.error(errorMessage);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get("/audit-logs/stats?days=7");
      setStats(response.data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      setStats(null);
    }
  };

  const cleanOldLogs = async () => {
    if (!confirm("¿Está seguro que desea eliminar los logs de auditoría antiguos (mayores a 365 días)?")) {
      return;
    }

    try {
      const response = await api.delete("/audit-logs/clean", {
        data: { daysToKeep: 365 }
      });
      toast.success(response.data.message);
      loadLogs();
      loadStats();
    } catch (error) {
      console.error("Error al limpiar logs:", error);
      toast.error("Error al limpiar logs");
    }
  };

  const exportLogs = () => {
    const headers = ["Fecha", "Usuario", "Módulo", "Acción", "Entidad", "Descripción"];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString("es-DO"),
      log.userInfo?.name || "Desconocido",
      log.module,
      log.action,
      `${log.entity.type} - ${log.entity.name}`,
      log.description
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      info: { color: "info", icon: CheckCircle },
      warning: { color: "warning", icon: AlertTriangle },
      critical: { color: "error", icon: XCircle }
    };

    const badge = badges[severity] || badges.info;
    const Icon = badge.icon;

    return (
      <Chip
        icon={<Icon size={16} />}
        label={severity}
        color={badge.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const getModuleBadge = (module) => {
    const colors = {
      ventas: "success",
      inventario: "secondary",
      clientes: "info",
      proveedores: "info",
      usuarios: "warning",
      caja: "warning",
      devoluciones: "error",
      ordenes_compra: "info",
      configuracion: "default"
    };

    return (
      <Chip
        label={module.replace("_", " ").toUpperCase()}
        color={colors[module] || "default"}
        size="small"
        variant="filled"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const resetFilters = () => {
    setFilters({
      module: "",
      action: "",
      severity: "",
      entityType: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 50
    });
  };

  const handlePageChange = (event, value) => {
    setFilters({ ...filters, page: value });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Shield size={32} color={theme.palette.primary.main} />
            Auditoría de Acciones
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Registro de eventos de negocio significativos
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Download size={18} />}
            onClick={exportLogs}
            disabled={logs.length === 0}
          >
            Exportar CSV
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Trash2 size={18} />}
            onClick={cleanOldLogs}
          >
            Limpiar Antiguos
          </Button>
        </Stack>
      </Box>

      {/* Estadísticas */}
      {stats && stats.summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Acciones (7d)</Typography>
                  <Typography variant="h4" fontWeight="bold">{stats.summary.total}</Typography>
                </Box>
                <Shield size={40} color={theme.palette.primary.main} opacity={0.8} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Críticas</Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">{stats.summary.critical}</Typography>
                </Box>
                <XCircle size={40} color={theme.palette.error.main} opacity={0.8} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Advertencias</Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">{stats.summary.warning}</Typography>
                </Box>
                <AlertTriangle size={40} color={theme.palette.warning.main} opacity={0.8} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Normales</Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{stats.summary.info}</Typography>
                </Box>
                <CheckCircle size={40} color={theme.palette.success.main} opacity={0.8} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Filter size={20} />
            Filtros
          </Typography>
          <Button size="small" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Módulo</InputLabel>
              <Select
                value={filters.module}
                label="Módulo"
                onChange={(e) => setFilters({ ...filters, module: e.target.value, page: 1 })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ventas">Ventas</MenuItem>
                <MenuItem value="inventario">Inventario</MenuItem>
                <MenuItem value="clientes">Clientes</MenuItem>
                <MenuItem value="proveedores">Proveedores</MenuItem>
                <MenuItem value="usuarios">Usuarios</MenuItem>
                <MenuItem value="caja">Caja</MenuItem>
                <MenuItem value="devoluciones">Devoluciones</MenuItem>
                <MenuItem value="ordenes_compra">Órdenes de Compra</MenuItem>
                <MenuItem value="configuracion">Configuración</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Acción</InputLabel>
              <Select
                value={filters.action}
                label="Acción"
                onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem disabled sx={{ opacity: 1, fontWeight: 'bold' }}>Ventas</MenuItem>
                <MenuItem value="Creación de Venta" sx={{ pl: 4 }}>Creación de Venta</MenuItem>
                <MenuItem value="Anulación de Venta" sx={{ pl: 4 }}>Anulación de Venta</MenuItem>
                <MenuItem value="Modificación de Venta" sx={{ pl: 4 }}>Modificación de Venta</MenuItem>

                <MenuItem disabled sx={{ opacity: 1, fontWeight: 'bold' }}>Inventario</MenuItem>
                <MenuItem value="Creación de Producto" sx={{ pl: 4 }}>Creación de Producto</MenuItem>
                <MenuItem value="Eliminación de Producto" sx={{ pl: 4 }}>Eliminación de Producto</MenuItem>
                <MenuItem value="Modificación de Producto" sx={{ pl: 4 }}>Modificación de Producto</MenuItem>
                <MenuItem value="Ajuste de Stock" sx={{ pl: 4 }}>Ajuste de Stock</MenuItem>

                <MenuItem disabled sx={{ opacity: 1, fontWeight: 'bold' }}>Usuarios</MenuItem>
                <MenuItem value="Inicio de Sesión Exitoso" sx={{ pl: 4 }}>Login Exitoso</MenuItem>
                <MenuItem value="Intento de Inicio de Sesión Fallido" sx={{ pl: 4 }}>Login Fallido</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Severidad</InputLabel>
              <Select
                value={filters.severity}
                label="Severidad"
                onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4} lg={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Entidad</InputLabel>
              <Select
                value={filters.entityType}
                label="Entidad"
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value, page: 1 })}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="Factura">Factura</MenuItem>
                <MenuItem value="Producto">Producto</MenuItem>
                <MenuItem value="Cliente">Cliente</MenuItem>
                <MenuItem value="Proveedor">Proveedor</MenuItem>
                <MenuItem value="Usuario">Usuario</MenuItem>
                <MenuItem value="Caja">Caja</MenuItem>
                <MenuItem value="Devolución">Devolución</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4} lg={2}>
            <TextField
              fullWidth
              size="small"
              label="Fecha inicio"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={4} lg={2}>
            <TextField
              fullWidth
              size="small"
              label="Fecha fin"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 5, opacity: 0.6 }}>
            <Shield size={48} />
            <Typography variant="h6" sx={{ mt: 2 }}>No hay logs disponibles</Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha/Hora</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Módulo</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Entidad</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Severidad</TableCell>
                  <TableCell>Detalles</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Clock size={16} color={theme.palette.text.secondary} />
                        <Typography variant="body2">
                          {new Date(log.timestamp).toLocaleString("es-DO")}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <User size={16} color={theme.palette.text.secondary} />
                        <Box>
                          <Typography variant="subtitle2">{log.userInfo?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{log.userInfo?.role}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{getModuleBadge(log.module)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{log.action}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{log.entity.type}</Typography>
                        <Typography variant="caption" color="text.secondary">{log.entity.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap title={log.description}>
                        {log.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary" onClick={() => setSelectedLog(log)}>
                        <Eye size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación */}
            {pagination && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination
                  count={pagination.pages}
                  page={filters.page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </TableContainer>

      {/* Modal de Detalles */}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Detalles de Auditoría
          <IconButton onClick={() => setSelectedLog(null)}>
            <XCircle size={24} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Usuario</Typography>
                <Typography variant="h6">{selectedLog.userInfo?.name} ({selectedLog.userInfo?.email})</Typography>
                <Typography variant="body2" color="text.secondary">Rol: {selectedLog.userInfo?.role}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Fecha y Hora</Typography>
                <Typography variant="body1">
                  {new Date(selectedLog.timestamp).toLocaleString("es-DO", { dateStyle: "full", timeStyle: "long" })}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Módulo</Typography>
                  {getModuleBadge(selectedLog.module)}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Severidad</Typography>
                  {getSeverityBadge(selectedLog.severity)}
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Acción</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedLog.action}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Entidad Afectada</Typography>
                <Typography variant="body1">
                  {selectedLog.entity.type}: <strong>{selectedLog.entity.name}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">ID: {selectedLog.entity.id}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {selectedLog.description}
                  </Typography>
                </Paper>
              </Box>

              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Cambios Realizados</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      {selectedLog.changes.map((change, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
                          <Typography variant="body2" fontWeight="bold">{change.fieldLabel}:</Typography>
                          <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                            {String(change.oldValue)}
                          </Typography>
                          <Typography variant="body2">→</Typography>
                          <Typography variant="body2" color="success.main" fontWeight="medium">
                            {String(change.newValue)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Box>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Información Adicional</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', overflowX: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AuditLogs;
