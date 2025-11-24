import { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";
import {
  Activity,
  XCircle,
  AlertCircle,
  Filter,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  User,
  Download,
  Trash2,
  Package
} from "lucide-react";
import {
  Container,
  Box,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  useTheme,
  CircularProgress,
  Tooltip
} from "@mui/material";

const Logs = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [filters, setFilters] = useState({
    type: "",
    module: "",
    severity: "",
    isSystemAction: "",
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

      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data.logs || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error al cargar logs:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error al cargar logs";
      toast.error(errorMessage);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get("/logs/stats?days=7");
      setStats(response.data || []);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      setStats([]);
    }
  };

  const cleanOldLogs = async () => {
    if (!confirm("¿Está seguro que desea eliminar los logs antiguos (mayores a 90 días)?")) {
      return;
    }

    try {
      const response = await api.delete("/logs/clean", {
        data: { daysToKeep: 90 }
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
    const headers = ["Fecha", "Tipo", "Módulo", "Acción", "Usuario", "Mensaje"];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString("es-DO"),
      log.type,
      log.module,
      log.action,
      log.userDetails?.name || log.userDetails?.username || "Sistema",
      log.message
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getTypeColor = (type) => {
    const colors = {
      error: "error",
      warning: "warning",
      success: "success",
      info: "info",
      auth: "secondary",
      action: "primary"
    };
    return colors[type] || "default";
  };

  const getTypeIcon = (type, size = 20) => {
    const icons = {
      error: <XCircle size={size} />,
      warning: <AlertTriangle size={size} />,
      success: <CheckCircle size={size} />,
      info: <Info size={size} />,
      auth: <User size={size} />,
      action: <Activity size={size} />
    };
    return icons[type] || <AlertCircle size={size} />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      error: "Error",
      warning: "Advertencia",
      success: "Éxito",
      info: "Información",
      auth: "Autenticación",
      action: "Acción"
    };
    return labels[type] || type;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: "success",
      medium: "warning",
      high: "error",
      critical: "error"
    };
    return colors[severity] || "default";
  };

  const resetFilters = () => {
    setFilters({
      type: "",
      module: "",
      severity: "",
      isSystemAction: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 50
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Activity size={32} color={theme.palette.primary.main} />
            <Typography variant="h4" fontWeight="bold">Sistema de Logs</Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Auditoría y seguimiento de actividades del sistema
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
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
            startIcon={<Trash2 size={18} />}
            onClick={cleanOldLogs}
          >
            Limpiar Antiguos
          </Button>
        </Box>
      </Box>

      {stats && stats.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Logs (7d)</Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.reduce((sum, s) => sum + s.count, 0)}
                    </Typography>
                  </Box>
                  <Activity size={32} color={theme.palette.primary.main} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Errores</Typography>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {stats.reduce((sum, s) => sum + s.errors, 0)}
                    </Typography>
                  </Box>
                  <XCircle size={32} color={theme.palette.error.main} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Módulos Activos</Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {new Set(stats.map(s => s._id.module)).size}
                    </Typography>
                  </Box>
                  <Package size={32} color={theme.palette.info.main} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tiempo Promedio</Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {(stats.reduce((sum, s) => sum + (s.avgDuration || 0), 0) / stats.length).toFixed(0)}ms
                    </Typography>
                  </Box>
                  <AlertCircle size={32} color={theme.palette.success.main} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Filter size={20} color={theme.palette.text.secondary} />
          <Typography variant="h6">Filtros</Typography>
          <Button
            size="small"
            onClick={resetFilters}
            sx={{ ml: 'auto' }}
          >
            Limpiar filtros
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={1.7}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filters.type}
                label="Tipo"
                onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="auth">Auth</MenuItem>
                <MenuItem value="action">Action</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6} lg={1.7}>
            <FormControl fullWidth size="small">
              <InputLabel>Módulo</InputLabel>
              <Select
                value={filters.module}
                label="Módulo"
                onChange={(e) => setFilters({ ...filters, module: e.target.value, page: 1 })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="auth">Auth</MenuItem>
                <MenuItem value="products">Products</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="returns">Returns</MenuItem>
                <MenuItem value="customers">Customers</MenuItem>
                <MenuItem value="suppliers">Suppliers</MenuItem>
                <MenuItem value="users">Users</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6} lg={1.7}>
            <FormControl fullWidth size="small">
              <InputLabel>Severidad</InputLabel>
              <Select
                value={filters.severity}
                label="Severidad"
                onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6} lg={1.7}>
            <FormControl fullWidth size="small">
              <InputLabel>Origen</InputLabel>
              <Select
                value={filters.isSystemAction}
                label="Origen"
                onChange={(e) => setFilters({ ...filters, isSystemAction: e.target.value, page: 1 })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="false">👤 Usuario</MenuItem>
                <MenuItem value="true">⚙️ Sistema</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6} lg={1.7}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Desde"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={1.7}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Hasta"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={1.7}>
            <FormControl fullWidth size="small">
              <InputLabel>Límite</InputLabel>
              <Select
                value={filters.limit}
                label="Límite"
                onChange={(e) => setFilters({ ...filters, limit: e.target.value, page: 1 })}
              >
                <MenuItem value="25">25 logs</MenuItem>
                <MenuItem value="50">50 logs</MenuItem>
                <MenuItem value="100">100 logs</MenuItem>
                <MenuItem value="200">200 logs</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 12 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 12 }}>
            <AlertCircle size={64} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
            <Typography color="text.secondary">No se encontraron logs con los filtros seleccionados</Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha/Hora</TableCell>
                  <TableCell>Módulo</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Mensaje</TableCell>
                  <TableCell>Severidad</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell>
                      <Tooltip title={getTypeLabel(log.type)}>
                        <Chip
                          icon={getTypeIcon(log.type, 16)}
                          label={getTypeLabel(log.type)}
                          color={getTypeColor(log.type)}
                          size="small"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(log.timestamp).toLocaleString("es-DO")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {log.module}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.action}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={log.isSystemAction ? "⚙️" : "👤"}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="body2">
                          {log.userDetails?.name || log.userDetails?.username || "Sistema"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 400 }}>
                      <Typography variant="body2" noWrap title={log.message}>
                        {log.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.severity}
                        color={getSeverityColor(log.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalles completos">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination && pagination.pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Página {pagination.page} de {pagination.pages} ({pagination.total} logs)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= pagination.pages}
                  >
                    Siguiente
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </TableContainer>

      <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Detalles del Log
          <IconButton onClick={() => setSelectedLog(null)} size="small">
            <XCircle size={24} />
          </IconButton>
        </DialogTitle>
        {selectedLog && (
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Tipo</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  {getTypeIcon(selectedLog.type)}
                  <Typography fontWeight="medium">{getTypeLabel(selectedLog.type)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Severidad</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={selectedLog.severity} color={getSeverityColor(selectedLog.severity)} size="small" />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Módulo</Typography>
                <Typography fontWeight="medium">{selectedLog.module}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Acción</Typography>
                <Typography fontWeight="medium">{selectedLog.action}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Fecha/Hora</Typography>
                <Typography>{new Date(selectedLog.timestamp).toLocaleString("es-DO")}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Usuario</Typography>
                <Typography>{selectedLog.userDetails?.name || selectedLog.userDetails?.username || "Sistema"}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Mensaje</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: 'action.hover' }}>
                  <Typography variant="body2">{selectedLog.message}</Typography>
                </Paper>
              </Grid>

              {selectedLog.request && Object.keys(selectedLog.request).length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Información de la Petición</Typography>
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: 'action.hover', overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedLog.request, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Detalles</Typography>
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: 'action.hover', overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              )}

              {selectedLog.error && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="error">Error</Typography>
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: 'error.light', borderColor: 'error.main' }}>
                    <Typography variant="body2" fontWeight="medium" color="error.dark">{selectedLog.error.message}</Typography>
                    {selectedLog.error.stack && (
                      <pre style={{ margin: '8px 0 0 0', fontSize: 11, whiteSpace: 'pre-wrap' }}>
                        {selectedLog.error.stack}
                      </pre>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Logs;
