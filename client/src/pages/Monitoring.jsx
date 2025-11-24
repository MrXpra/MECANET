import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import {
  Activity,
  Cpu,
  HardDrive,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  CheckSquare
} from 'lucide-react';
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
  LinearProgress,
  useTheme,
  Alert,
  AlertTitle
} from '@mui/material';

const Monitoring = () => {
  const theme = useTheme();
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [recentErrors, setRecentErrors] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedError, setSelectedError] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  useEffect(() => {
    loadAllMetrics();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadAllMetrics();
      }, 30000); // Refresh cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadAllMetrics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSystemMetrics(),
        loadPerformanceMetrics(),
        loadRecentErrors(),
        loadCriticalAlerts()
      ]);
    } catch (error) {
      console.error('Error al cargar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const response = await api.get('/logs/monitoring/system');
      setSystemMetrics(response.data);
    } catch (error) {
      console.error('Error al cargar métricas del sistema:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const response = await api.get('/logs/performance?hours=24');
      setPerformanceMetrics(response.data);
    } catch (error) {
      console.error('Error al cargar métricas de rendimiento:', error);
    }
  };

  const loadRecentErrors = async () => {
    try {
      const response = await api.get('/logs/errors?limit=10');
      setRecentErrors(response.data);
    } catch (error) {
      console.error('Error al cargar errores recientes:', error);
    }
  };

  const loadCriticalAlerts = async () => {
    try {
      const response = await api.get('/logs/alerts');
      setCriticalAlerts(response.data);
    } catch (error) {
      console.error('Error al cargar alertas críticas:', error);
    }
  };

  const handleResolveClick = (error) => {
    setSelectedError(error);
    setResolutionText('');
    setShowResolveDialog(true);
  };

  const resolveError = async () => {
    if (!selectedError || !resolutionText.trim()) return;

    try {
      await api.patch(`/logs/${selectedError._id}/resolve`, { resolution: resolutionText });
      toast.success('Error marcado como resuelto');
      loadRecentErrors();
      loadCriticalAlerts();
      setShowResolveDialog(false);
      setSelectedError(null);
    } catch (error) {
      toast.error('Error al resolver log');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Activity size={32} color={theme.palette.primary.main} />
            Monitoreo del Sistema
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Métricas en tiempo real y análisis de rendimiento
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant={autoRefresh ? "contained" : "outlined"}
            color={autoRefresh ? "success" : "primary"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            startIcon={<RefreshCw size={18} className={autoRefresh ? 'animate-spin' : ''} />}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="contained"
            onClick={loadAllMetrics}
            startIcon={<RefreshCw size={18} />}
          >
            Actualizar
          </Button>
        </Stack>
      </Box>

      {/* Alertas Críticas */}
      {criticalAlerts.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, borderLeft: 6, borderColor: 'error.main', bgcolor: 'error.lighter' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <AlertTriangle size={24} color={theme.palette.error.main} />
            <Typography variant="h6" color="error.main" fontWeight="bold">
              {criticalAlerts.length} Alerta{criticalAlerts.length > 1 ? 's' : ''} Crítica{criticalAlerts.length > 1 ? 's' : ''}
            </Typography>
          </Box>
          <Stack spacing={2}>
            {criticalAlerts.slice(0, 3).map((alert) => (
              <Paper key={alert._id} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
                <Box>
                  <Typography variant="subtitle1" color="error.dark" fontWeight="medium">{alert.message}</Typography>
                  <Typography variant="caption" color="error.main">
                    {new Date(alert.timestamp).toLocaleString('es-DO')}
                  </Typography>
                </Box>
                <IconButton color="error" onClick={() => setSelectedError(alert)}>
                  <Eye size={20} />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Métricas del Sistema en Tiempo Real */}
      {systemMetrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* CPU */}
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cpu size={20} color={theme.palette.info.main} />
                    <Typography variant="subtitle2" color="text.secondary">CPU</Typography>
                  </Box>
                  <CheckCircle size={16} color={theme.palette.success.main} />
                </Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {systemMetrics.cpu.cores} cores
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" noWrap title={systemMetrics.cpu.model}>
                  {systemMetrics.cpu.model}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">Load Avg</Typography>
                  <Stack direction="row" spacing={1} mt={0.5}>
                    {systemMetrics.loadAverage.map((load, i) => (
                      <Chip key={i} label={load.toFixed(2)} size="small" color="info" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Memoria */}
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HardDrive size={20} color={theme.palette.secondary.main} />
                    <Typography variant="subtitle2" color="text.secondary">Memoria</Typography>
                  </Box>
                  <CheckCircle size={16} color={theme.palette.success.main} />
                </Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {systemMetrics.memoryUsagePercent}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(systemMetrics.memoryUsagePercent)}
                    color={
                      parseFloat(systemMetrics.memoryUsagePercent) > 80 ? 'error' :
                        parseFloat(systemMetrics.memoryUsagePercent) > 60 ? 'warning' :
                          'success'
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Uptime */}
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Clock size={20} color={theme.palette.success.main} />
                    <Typography variant="subtitle2" color="text.secondary">Uptime</Typography>
                  </Box>
                  <CheckCircle size={16} color={theme.palette.success.main} />
                </Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {formatUptime(systemMetrics.uptime)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {systemMetrics.platform} - Node {systemMetrics.nodeVersion}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  PID: {systemMetrics.processId}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Estado General */}
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Activity size={20} color={theme.palette.primary.main} />
                    <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                  </Box>
                  <CheckCircle size={16} color={theme.palette.success.main} />
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
                  Operativo
                </Typography>
                <Stack spacing={0.5} mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    Errores: {recentErrors.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Alertas: {criticalAlerts.length}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Métricas de Rendimiento */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <TrendingUp size={24} color={theme.palette.primary.main} />
          <Typography variant="h6" fontWeight="bold">Rendimiento (Últimas 24h)</Typography>
        </Box>

        {performanceMetrics.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Módulo</TableCell>
                  <TableCell>Operaciones</TableCell>
                  <TableCell>Tiempo Promedio</TableCell>
                  <TableCell>Tiempo Máx</TableCell>
                  <TableCell>DB Promedio</TableCell>
                  <TableCell>Lentas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performanceMetrics.slice(0, 10).map((metric, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>{metric._id.module}</TableCell>
                    <TableCell>{metric.totalOperations}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={
                          metric.avgExecutionTime > 1000 ? 'error.main' :
                            metric.avgExecutionTime > 500 ? 'warning.main' :
                              'success.main'
                        }
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {metric.avgExecutionTime.toFixed(0)}ms
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {metric.maxExecutionTime.toFixed(0)}ms
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {(metric.avgDbTime || 0).toFixed(0)}ms
                    </TableCell>
                    <TableCell>
                      {metric.slowOperations > 0 ? (
                        <Chip
                          icon={<AlertTriangle size={14} />}
                          label={metric.slowOperations}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="success.main">0</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary" align="center" py={4}>
            No hay datos de rendimiento disponibles
          </Typography>
        )}
      </Paper>

      {/* Errores Recientes */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <XCircle size={24} color={theme.palette.error.main} />
          <Typography variant="h6" fontWeight="bold">Errores Recientes</Typography>
        </Box>

        {recentErrors.length > 0 ? (
          <Stack spacing={2}>
            {recentErrors.map((error) => (
              <Paper
                key={error._id}
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : '#FEF2F2',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.3)' : '#FECACA'
                }}
              >
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={error.module} size="small" color="error" variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(error.timestamp).toLocaleString('es-DO')}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" fontWeight="bold" color="error.dark">
                      {error.message}
                    </Typography>
                    {error.error?.message && (
                      <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                        {error.error.message}
                      </Typography>
                    )}
                    {error.user && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Usuario: {error.userDetails?.fullName || error.userDetails?.username}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item>
                    <Stack direction="row" spacing={1}>
                      <IconButton color="error" onClick={() => setSelectedError(error)} title="Ver detalles">
                        <Eye size={20} />
                      </IconButton>
                      {!error.metadata?.resolved && (
                        <IconButton color="success" onClick={() => handleResolveClick(error)} title="Marcar como resuelto">
                          <CheckSquare size={20} />
                        </IconButton>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle size={48} color={theme.palette.success.main} style={{ marginBottom: 8, opacity: 0.5 }} />
            <Typography color="text.secondary">No hay errores recientes sin resolver</Typography>
          </Box>
        )}
      </Paper>

      {/* Modal de Detalles de Error */}
      <Dialog
        open={!!selectedError && !showResolveDialog}
        onClose={() => setSelectedError(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Detalles del Error
          <IconButton onClick={() => setSelectedError(null)}>
            <XCircle size={24} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedError && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Mensaje</Typography>
                <Alert severity="error" icon={false} sx={{ mt: 1 }}>
                  {selectedError.message}
                </Alert>
              </Box>

              {selectedError.error && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Error Detallado</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'action.hover' }}>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      {selectedError.error.message}
                    </Typography>
                    {selectedError.error.stack && (
                      <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
                          {selectedError.error.stack}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Módulo</Typography>
                  <Typography variant="body1">{selectedError.module}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Severidad</Typography>
                  <Chip
                    label={selectedError.severity}
                    color={
                      selectedError.severity === 'critical' ? 'error' :
                        selectedError.severity === 'high' ? 'warning' :
                          'info'
                    }
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Fecha/Hora</Typography>
                  <Typography variant="body1">
                    {new Date(selectedError.timestamp).toLocaleString('es-DO')}
                  </Typography>
                </Grid>
                {selectedError.user && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Usuario</Typography>
                    <Typography variant="body1">
                      {selectedError.userDetails?.fullName || selectedError.userDetails?.username}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {selectedError.request && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Request Info</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'action.hover', overflowX: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                      {JSON.stringify(selectedError.request, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {!selectedError?.metadata?.resolved && (
            <Button onClick={() => { setShowResolveDialog(true); }} color="primary">
              Marcar como Resuelto
            </Button>
          )}
          <Button onClick={() => setSelectedError(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Resolución */}
      <Dialog open={showResolveDialog} onClose={() => setShowResolveDialog(false)}>
        <DialogTitle>Resolver Error</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Describe cómo se resolvió este error para futuras referencias.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Resolución"
            fullWidth
            multiline
            rows={3}
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResolveDialog(false)}>Cancelar</Button>
          <Button onClick={resolveError} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Monitoring;
