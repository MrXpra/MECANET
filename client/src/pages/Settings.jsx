import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getSettings,
  updateSettings,
  exportSystemData,
  importSystemData,
  cleanTestData,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useThemeStore } from '../store/themeStore';
import toast from 'react-hot-toast';
import WeatherWidget from '../components/WeatherWidget';
import {
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  AlertCircle,
  Check,
  Info,
  Package,
  Receipt,
  Bell,
  Eye,
  EyeOff,
  Globe,
  CreditCard,
  Cloud,
  Send,
  Download,
  Upload,
  Trash2,
  Database,
  FileDown,
  FileUp,
  Gift,
} from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  TextField,
  Switch,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  Tooltip,
  useTheme,
  Chip,
  Skeleton
} from '@mui/material';

const Settings = ({ section = 'all' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAuthStore();
  const { setSettings: updateSettingsStore } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showCleanConfirmModal, setShowCleanConfirmModal] = useState(false);
  const [cleanConfirmText, setCleanConfirmText] = useState('');
  const [importMode, setImportMode] = useState('merge');
  const [notificationPrefs, setNotificationPrefs] = useState({
    lowStockAlerts: true,
    expirationAlerts: true,
    salesAlerts: true,
    paymentReminders: true
  });
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    businessName: '',
    businessLogoUrl: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    smtp: {
      enabled: true,
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: '',
      password: '',
      fromName: '',
      fromEmail: ''
    },
    taxRate: 0,
    currency: 'DOP',
    receiptFooter: '',
    lowStockAlert: true,
    weatherLocation: 'Santo Domingo,DO',
    weatherApiKey: '',
    showWeather: true,
    autoCreatePurchaseOrders: false,
    requireOrderReception: true,
    autoOrderThreshold: 5,
    toastPosition: 'top-center',
    logRetention: {
      info: 7,
      warning: 30,
      error: 90,
      critical: 180
    }
  });

  const [originalData, setOriginalData] = useState({});
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const smtpEnabled = formData.smtp?.enabled !== false;
  const isAdminUser = user?.role === 'admin';
  const isDeveloper = user?.role === 'desarrollador' || user?.role === 'developer';
  const canManageSettings = ['admin', 'desarrollador'].includes(user?.role);

  useEffect(() => {
    fetchSettings();
    fetchNotificationPreferences();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await getSettings();

      const smtpDefaults = {
        enabled: true,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        user: '',
        password: '',
        fromName: '',
        fromEmail: ''
      };

      const settingsData = {
        ...response.data,
        smtp: {
          ...smtpDefaults,
          ...(response.data.smtp || {})
        },
        logRetention: {
          info: 7,
          warning: 30,
          error: 90,
          critical: 180,
          ...(response.data.logRetention || {})
        }
      };

      if (settingsData.requireOrderReception === undefined) {
        settingsData.requireOrderReception = true;
      }

      setFormData(settingsData);
      setOriginalData(settingsData);
      updateSettingsStore(settingsData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(originalData).length === 0) return;

    const hasRealChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    if (!hasRealChanges) {
      setHasChanges(false);
      return;
    }

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      autoSaveSettings();
    }, 300);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [formData, originalData]);

  const autoSaveSettings = async () => {
    if (!formData.businessName.trim()) {
      toast.error('El nombre del negocio es requerido');
      return;
    }

    if (formData.taxRate < 0 || formData.taxRate > 100) {
      toast.error('La tasa de impuesto debe estar entre 0 y 100');
      return;
    }

    try {
      setIsSaving(true);
      await updateSettings(formData);
      setOriginalData(formData);
      setHasChanges(false);
      updateSettingsStore(formData);
      toast.success('✨ Guardado', {
        duration: 1500,
        icon: '💾',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setHasChanges(true);

    if (field === 'forceChristmas') {
      updateSettingsStore(newData);
    }
  };

  const handleSmtpChange = (field, value) => {
    setFormData({
      ...formData,
      smtp: { ...formData.smtp, [field]: value }
    });
    setHasChanges(true);
  };

  const toggleSmtpEnabled = () => {
    if (!canManageSettings) return;
    handleSmtpChange('enabled', !smtpEnabled);
  };

  const fetchNotificationPreferences = async () => {
    try {
      const response = await getNotificationPreferences();
      if (response.data?.data) {
        setNotificationPrefs(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar preferencias de notificaciones:', error);
    }
  };

  const handleNotificationPrefChange = async (key, value) => {
    try {
      const newPrefs = { ...notificationPrefs, [key]: value };
      setNotificationPrefs(newPrefs);

      await updateNotificationPreferences(newPrefs);
      toast.success('Preferencia actualizada', { duration: 1500 });
    } catch (error) {
      console.error('Error al actualizar preferencia:', error);
      toast.error('Error al actualizar preferencia');
      setNotificationPrefs(notificationPrefs);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      toast.loading('Exportando datos...', { id: 'export' });

      const response = await exportSystemData();
      const data = response.data;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sgtm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`✅ Datos exportados: ${data.metadata.totalRecords.products} productos, ${data.metadata.totalRecords.sales} ventas`, { id: 'export' });
    } catch (error) {
      console.error('Error al exportar datos:', error);
      toast.error('Error al exportar datos', { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      toast.loading('Importando datos...', { id: 'import' });

      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.metadata || !importData.data) {
        throw new Error('Archivo inválido: estructura incorrecta');
      }

      const confirmMsg = importMode === 'replace'
        ? '⚠️ MODO REEMPLAZAR: Se eliminarán datos existentes. ¿Continuar?'
        : '¿Importar datos en modo COMBINAR?';

      if (!window.confirm(confirmMsg)) {
        toast.dismiss('import');
        setIsImporting(false);
        return;
      }

      const response = await importSystemData(importData, importMode);

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`, { id: 'import', duration: 4000 });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(`⚠️ ${response.data.message}`, { id: 'import', duration: 4000 });
      }
    } catch (error) {
      console.error('Error al importar datos:', error);
      toast.error(error.message || 'Error al importar datos', { id: 'import' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCleanTestData = async () => {
    if (cleanConfirmText !== 'ELIMINAR DATOS DE PRUEBA') {
      toast.error('Debe escribir exactamente: ELIMINAR DATOS DE PRUEBA');
      return;
    }

    try {
      setIsCleaning(true);
      toast.loading('Limpiando datos de prueba...', { id: 'clean' });

      const response = await cleanTestData(cleanConfirmText);

      if (response.data.success) {
        const { deleted } = response.data;
        const summary = Object.entries(deleted)
          .filter(([_, count]) => count > 0)
          .map(([key, count]) => `${count} ${key}`)
          .join(', ');

        toast.success(`✅ ${response.data.message}\nEliminados: ${summary || 'ninguno'}`, { id: 'clean', duration: 5000 });
        setShowCleanConfirmModal(false);
        setCleanConfirmText('');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(response.data.message, { id: 'clean' });
      }
    } catch (error) {
      console.error('Error al limpiar datos:', error);
      toast.error('Error al limpiar datos de prueba', { id: 'clean' });
    } finally {
      setIsCleaning(false);
    }
  };

  const [isCleaningLogs, setIsCleaningLogs] = useState(false);
  const [showLogCleanModal, setShowLogCleanModal] = useState(false);
  const [logCleanFilters, setLogCleanFilters] = useState({
    type: 'all',
    severity: 'all',
    days: ''
  });

  const handleCleanLogs = async () => {
    try {
      setIsCleaningLogs(true);
      toast.loading('Limpiando logs...', { id: 'clean-logs' });

      const response = await fetch('/api/logs/clean', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...logCleanFilters,
          all: logCleanFilters.type === 'all' && logCleanFilters.severity === 'all' && !logCleanFilters.days
        })
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Respuesta inválida del servidor. Verifica tu conexión y autenticación.');
      }

      if (response.ok) {
        toast.success(`✅ ${data.message}`, { id: 'clean-logs' });
        setShowLogCleanModal(false);
      } else {
        throw new Error(data.message || 'Error al limpiar logs');
      }
    } catch (error) {
      console.error('Error al limpiar logs:', error);
      toast.error(error.message || 'Error al limpiar logs', { id: 'clean-logs' });
    } finally {
      setIsCleaningLogs(false);
    }
  };

  const handleTestEmail = async () => {
    if (!smtpEnabled) {
      toast.error('Activa el envío de correos para probar la conexión.');
      return;
    }

    try {
      setTestingEmail(true);

      if (hasChanges) {
        toast.loading('Guardando configuración...', { id: 'saving-smtp' });
        await updateSettings(formData);
        setOriginalData(formData);
        setHasChanges(false);
        updateSettingsStore(formData);
        toast.dismiss('saving-smtp');
      }

      const response = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        toast.success('✅ Configuración SMTP correcta. El email se puede enviar.');
      } else {
        toast.error(`❌ ${data.message || 'Error al probar conexión'}`);
      }
    } catch (error) {
      console.error('Error al probar conexión SMTP:', error);
      toast.error('Error al probar conexión SMTP');
    } finally {
      setTestingEmail(false);
    }
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join('-');
    }
    return value;
  };

  const tabs = [
    { id: 'business', label: 'Negocio', icon: Building2, path: '/configuracion/negocio' },
    { id: 'system', label: 'Sistema', icon: Globe, path: '/configuracion/sistema' },
    { id: 'notifications', label: 'Notificaciones', icon: Bell, path: '/configuracion/notificaciones' },
    { id: 'billing', label: 'Facturación', icon: CreditCard, path: '/configuracion/facturacion' },
    { id: 'integrations', label: 'Integraciones', icon: Cloud, path: '/configuracion/integraciones' },
  ].filter(tab => !tab.developerOnly || isDeveloper);

  const handleTabChange = (event, newValue) => {
    const tab = tabs.find(t => t.id === newValue);
    if (tab) {
      navigate(tab.path);
    }
  };

  const shouldShowSection = (sectionId) => {
    if (section === 'all') return true;
    return section === sectionId;
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Configuración
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra la configuración general del sistema
          </Typography>
        </Box>
        {canManageSettings && (
          <Chip
            icon={isSaving ? <CircularProgress size={16} /> : hasChanges ? <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main', animation: 'pulse 1s infinite' }} /> : <Check size={16} />}
            label={isSaving ? 'Guardando...' : hasChanges ? 'Guardando en 0.3s...' : 'Todo guardado'}
            color={isSaving ? 'default' : hasChanges ? 'info' : 'success'}
            variant="outlined"
          />
        )}
      </Box>

      {/* Tabs */}
      {section !== 'all' && (
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={section}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            indicatorColor="primary"
            textColor="primary"
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                label={tab.label}
                icon={<tab.icon size={20} />}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Paper>
      )}

      {!canManageSettings && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          Solo administradores o desarrolladores pueden modificar la configuración del sistema.
        </Alert>
      )}

      <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* Business Information */}
        {shouldShowSection('business') && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Building2 size={24} />
                </Box>
                <Box>
                  <Typography variant="h6">Información del Negocio</Typography>
                  <Typography variant="body2" color="text.secondary">Datos generales de la empresa</Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre del Negocio"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    disabled={!canManageSettings}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="URL del Logo"
                    value={formData.businessLogoUrl}
                    onChange={(e) => handleChange('businessLogoUrl', e.target.value)}
                    disabled={!canManageSettings}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="URL de la imagen del logo. Aparecerá en reportes y recibos impresos.">
                            <Info size={20} color={theme.palette.text.secondary} />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={formData.businessPhone}
                    onChange={(e) => handleChange('businessPhone', formatPhone(e.target.value))}
                    disabled={!canManageSettings}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Phone size={20} /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleChange('businessEmail', e.target.value)}
                    disabled={!canManageSettings}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Mail size={20} /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    multiline
                    rows={3}
                    value={formData.businessAddress}
                    onChange={(e) => handleChange('businessAddress', e.target.value)}
                    disabled={!canManageSettings}
                    InputProps={{
                      startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}><MapPin size={20} /></InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* SMTP Configuration */}
        {shouldShowSection('business') && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Mail size={24} />
                  </Box>
                  <Box>
                    <Typography variant="h6">Configuración de Email (SMTP)</Typography>
                    <Typography variant="body2" color="text.secondary">Configura el servidor SMTP para enviar órdenes de compra</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControl component="fieldset">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {smtpEnabled ? 'Activado' : 'Desactivado'}
                      </Typography>
                      <Switch
                        checked={smtpEnabled}
                        onChange={toggleSmtpEnabled}
                        disabled={!canManageSettings}
                      />
                    </Box>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={testingEmail ? <CircularProgress size={16} /> : <Send size={16} />}
                    onClick={handleTestEmail}
                    disabled={testingEmail || !canManageSettings || !smtpEnabled}
                  >
                    Probar
                  </Button>
                </Box>
              </Box>

              {!smtpEnabled && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  El envío de correos está desactivado. No podrás enviar órdenes de compra ni probar la conexión.
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Servidor SMTP"
                    value={formData.smtp?.host || ''}
                    onChange={(e) => handleSmtpChange('host', e.target.value)}
                    disabled={!canManageSettings || !smtpEnabled}
                    helperText="Gmail: smtp.gmail.com | Outlook: smtp.office365.com"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Puerto SMTP"
                    type="number"
                    value={formData.smtp?.port || 587}
                    onChange={(e) => handleSmtpChange('port', parseInt(e.target.value))}
                    disabled={!canManageSettings || !smtpEnabled}
                    helperText="TLS: 587 | SSL: 465"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Usuario / Email"
                    value={formData.smtp?.user || ''}
                    onChange={(e) => handleSmtpChange('user', e.target.value)}
                    disabled={!canManageSettings || !smtpEnabled}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contraseña de Aplicación"
                    type={showSmtpPassword ? "text" : "password"}
                    value={formData.smtp?.password || ''}
                    onChange={(e) => handleSmtpChange('password', e.target.value)}
                    disabled={!canManageSettings || !smtpEnabled}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowSmtpPassword(!showSmtpPassword)} edge="end">
                            {showSmtpPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Gmail: Genera una contraseña de aplicación de 16 caracteres."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre del Remitente"
                    value={formData.smtp?.fromName || ''}
                    onChange={(e) => handleSmtpChange('fromName', e.target.value)}
                    disabled={!canManageSettings || !smtpEnabled}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email del Remitente"
                    value={formData.smtp?.fromEmail || ''}
                    onChange={(e) => handleSmtpChange('fromEmail', e.target.value)}
                    disabled={!canManageSettings || !smtpEnabled}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Financial Settings */}
        {shouldShowSection('system') && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <DollarSign size={24} />
                </Box>
                <Box>
                  <Typography variant="h6">Configuración Financiera</Typography>
                  <Typography variant="body2" color="text.secondary">Impuestos y moneda</Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tasa de Impuesto (%)"
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                    disabled={!canManageSettings}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Porcentaje de impuesto (ITBIS) que se aplicará a las ventas.">
                            <Info size={20} color={theme.palette.text.secondary} />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    helperText={formData.taxRate > 0 ? `Se aplicará ${formData.taxRate}% de impuesto a las ventas` : 'Sin impuestos'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Moneda</InputLabel>
                    <Select
                      value={formData.currency}
                      label="Moneda"
                      onChange={(e) => handleChange('currency', e.target.value)}
                      disabled={!canManageSettings}
                    >
                      <MenuItem value="DOP">Peso Dominicano (DOP)</MenuItem>
                      <MenuItem value="USD">Dólar Estadounidense (USD)</MenuItem>
                      <MenuItem value="EUR">Euro (EUR)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Receipt Settings */}
        {shouldShowSection('billing') && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                  <Receipt size={24} />
                </Box>
                <Box>
                  <Typography variant="h6">Configuración de Recibos</Typography>
                  <Typography variant="body2" color="text.secondary">Personaliza los recibos impresos</Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Mensaje de Pie de Recibo"
                multiline
                rows={4}
                value={formData.receiptFooter}
                onChange={(e) => handleChange('receiptFooter', e.target.value)}
                disabled={!canManageSettings}
                InputProps={{
                  startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}><FileText size={20} /></InputAdornment>,
                }}
                helperText="Este mensaje aparecerá al final de cada recibo impreso"
              />
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        {shouldShowSection('notifications') && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <Bell size={24} />
                </Box>
                <Box>
                  <Typography variant="h6">Mis Preferencias de Notificaciones</Typography>
                  <Typography variant="body2" color="text.secondary">Elige qué alertas deseas recibir</Typography>
                </Box>
              </Box>

              <List>
                <ListItem>
                  <ListItemIcon><AlertCircle size={24} color={theme.palette.warning.main} /></ListItemIcon>
                  <ListItemText primary="Alertas de Stock Bajo" secondary="Notificaciones cuando productos estén por agotarse" />
                  <Switch
                    edge="end"
                    checked={notificationPrefs.lowStockAlerts}
                    onChange={(e) => handleNotificationPrefChange('lowStockAlerts', e.target.checked)}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon><AlertCircle size={24} color={theme.palette.error.main} /></ListItemIcon>
                  <ListItemText primary="Alertas de Vencimiento" secondary="Notificaciones sobre productos próximos a vencer" />
                  <Switch
                    edge="end"
                    checked={notificationPrefs.expirationAlerts}
                    onChange={(e) => handleNotificationPrefChange('expirationAlerts', e.target.checked)}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon><DollarSign size={24} color={theme.palette.success.main} /></ListItemIcon>
                  <ListItemText primary="Alertas de Ventas" secondary="Notificaciones sobre ventas importantes o hitos" />
                  <Switch
                    edge="end"
                    checked={notificationPrefs.salesAlerts}
                    onChange={(e) => handleNotificationPrefChange('salesAlerts', e.target.checked)}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon><CreditCard size={24} color={theme.palette.info.main} /></ListItemIcon>
                  <ListItemText primary="Recordatorios de Pagos" secondary="Notificaciones sobre pagos pendientes o vencidos" />
                  <Switch
                    edge="end"
                    checked={notificationPrefs.paymentReminders}
                    onChange={(e) => handleNotificationPrefChange('paymentReminders', e.target.checked)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        )}

        {/* Auto Theme Toggle */}
        {(section === 'all' || section === 'system') && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ p: 1, borderRadius: 1, background: 'linear-gradient(to bottom right, #8b5cf6, #2563eb)', color: '#fff' }}>
                  <Globe size={24} />
                </Box>
                <Box>
                  <Typography variant="h6">Tema Automático</Typography>
                  <Typography variant="body2" color="text.secondary">El tema oscuro se activa automáticamente según la hora del día</Typography>
                </Box>
              </Box>
              <AutoThemeToggle />
            </CardContent>
          </Card>
        )}

        {/* Developer Options */}
        {(section === 'all' || section === 'system') && isDeveloper && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Gift size={24} />
                </Box>
                <Box>
                  <Typography variant="h6">Opciones de Desarrollador</Typography>
                  <Typography variant="body2" color="text.secondary">Configuraciones de depuración y pruebas</Typography>
                </Box>
              </Box>

              <FormControl component="fieldset" fullWidth>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle1">Modo Navidad (Easter Egg)</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fuerza la activación del tema navideño (nieve y fondo especial)
                    </Typography>
                  </Box>
                  <Switch
                    checked={formData.forceChristmas || false}
                    onChange={(e) => handleChange('forceChristmas', e.target.checked)}
                  />
                </Box>
              </FormControl>
            </CardContent>
          </Card>
        )}

        {/* Data Management (Developer Only) */}
        {(section === 'all' || section === 'system') && isDeveloper && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Database size={24} />
                </Box>
                <Box>
                  <Typography variant="h6">Gestión de Datos</Typography>
                  <Typography variant="body2" color="text.secondary">Exportar, importar y limpiar datos del sistema</Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light', bgOpacity: 0.1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Exportar Datos</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>Descarga todos los datos del sistema en formato JSON</Typography>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <Download size={16} />}
                      onClick={handleExportData}
                      disabled={isExporting}
                    >
                      {isExporting ? 'Exportando...' : 'Exportar Datos'}
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.light', bgOpacity: 0.1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Importar Datos</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>Restaura datos desde un archivo JSON</Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <Select
                        value={importMode}
                        onChange={(e) => setImportMode(e.target.value)}
                      >
                        <MenuItem value="merge">Combinar</MenuItem>
                        <MenuItem value="replace">Reemplazar</MenuItem>
                      </Select>
                    </FormControl>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      style={{ display: 'none' }}
                      id="import-file-input"
                    />
                    <label htmlFor="import-file-input">
                      <Button
                        variant="contained"
                        color="info"
                        fullWidth
                        component="span"
                        startIcon={isImporting ? <CircularProgress size={16} color="inherit" /> : <Upload size={16} />}
                        disabled={isImporting}
                      >
                        {isImporting ? 'Importando...' : 'Seleccionar Archivo'}
                      </Button>
                    </label>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.light', bgOpacity: 0.1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Limpiar Datos de Prueba</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>Elimina productos, clientes y proveedores de prueba</Typography>
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      startIcon={<Trash2 size={16} />}
                      onClick={() => setShowCleanConfirmModal(true)}
                      disabled={isCleaning}
                    >
                      Limpiar Datos
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Clean Confirmation Modal */}
      <Dialog open={showCleanConfirmModal} onClose={() => setShowCleanConfirmModal(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertCircle color={theme.palette.error.main} />
          Confirmar Limpieza
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Esta acción eliminará productos, clientes y proveedores de prueba. NO se eliminarán usuarios ni configuración.
          </Alert>
          <Typography variant="body2" gutterBottom>
            Escribe exactamente: <strong>ELIMINAR DATOS DE PRUEBA</strong>
          </Typography>
          <TextField
            fullWidth
            value={cleanConfirmText}
            onChange={(e) => setCleanConfirmText(e.target.value)}
            placeholder="ELIMINAR DATOS DE PRUEBA"
            variant="outlined"
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCleanConfirmModal(false)} color="inherit">Cancelar</Button>
          <Button
            onClick={handleCleanTestData}
            color="error"
            variant="contained"
            disabled={cleanConfirmText !== 'ELIMINAR DATOS DE PRUEBA' || isCleaning}
          >
            {isCleaning ? 'Limpiando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log Clean Modal */}
      <Dialog open={showLogCleanModal} onClose={() => setShowLogCleanModal(false)}>
        <DialogTitle>Limpiar Logs</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Log</InputLabel>
              <Select
                value={logCleanFilters.type}
                label="Tipo de Log"
                onChange={(e) => setLogCleanFilters({ ...logCleanFilters, type: e.target.value })}
              >
                <MenuItem value="all">Todos los tipos</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Severidad</InputLabel>
              <Select
                value={logCleanFilters.severity}
                label="Severidad"
                onChange={(e) => setLogCleanFilters({ ...logCleanFilters, severity: e.target.value })}
              >
                <MenuItem value="all">Todas las severidades</MenuItem>
                <MenuItem value="low">Baja</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="critical">Crítica</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Antigüedad (Días)"
              type="number"
              value={logCleanFilters.days}
              onChange={(e) => setLogCleanFilters({ ...logCleanFilters, days: e.target.value })}
              helperText="Se borrarán logs más antiguos que X días."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogCleanModal(false)} color="inherit">Cancelar</Button>
          <Button
            onClick={handleCleanLogs}
            color="error"
            variant="contained"
            disabled={isCleaningLogs}
          >
            {isCleaningLogs ? 'Limpiando...' : 'Confirmar Limpieza'}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

const AutoThemeToggle = () => {
  const { autoThemeEnabled, enableAutoTheme, isDarkMode } = useThemeStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hour = currentTime.getHours();
  const shouldBeDark = hour >= 17 || hour < 7;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">Activar Tema Automático</Typography>
          <Typography variant="body2" color="text.secondary">El tema cambia automáticamente según la hora del día</Typography>
        </Box>
        <Switch
          checked={autoThemeEnabled}
          onChange={(e) => enableAutoTheme(e.target.checked)}
        />
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" fontWeight="bold">Tema Claro</Typography>
            <Typography variant="caption" color="text.secondary">7:00 AM - 4:59 PM</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.900', color: 'common.white' }}>
            <Typography variant="subtitle2" fontWeight="bold">Tema Oscuro</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>5:00 PM - 6:59 AM</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2">
          <strong>Hora actual:</strong> {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {autoThemeEnabled ? (
            <>
              Tema {shouldBeDark ? 'oscuro' : 'claro'} activado automáticamente
              {isDarkMode === shouldBeDark ? ' ✓' : ' (cambiando...)'}
            </>
          ) : (
            'Tema manual (automático desactivado)'
          )}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Settings;
