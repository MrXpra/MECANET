import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Box,
  Typography,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  useTheme
} from '@mui/material';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import API from '../../services/api';
import {
  Home,
  FileText,
  Package,
  Users,
  DollarSign,
  Settings,
  BarChart3,
  UserCog,
  ShoppingCart,
  Truck,
  ClipboardList,
  RefreshCw,
  Receipt,
  ChevronDown,
  ChevronRight,
  Building2,
  Globe,
  Bell,
  CreditCard,
  Cloud,
  Activity,
  Shield,
  Calendar,
  CheckCircle2,
  Info,
  HelpCircle
} from 'lucide-react';

const Sidebar = ({ drawerWidth }) => {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const location = useLocation();
  const theme = useTheme();

  const privilegedRoles = ['admin', 'desarrollador'];
  const canSeeAdminMenu = privilegedRoles.includes(user?.role);
  const isDeveloper = user?.role === 'desarrollador';
  const shortcutsEnabled = user?.shortcutsEnabled !== false;

  // Estados para controlar expansión de secciones
  const [configExpanded, setConfigExpanded] = useState(location.pathname.startsWith('/configuracion'));
  const [ventasExpanded, setVentasExpanded] = useState(
    location.pathname.includes('/facturacion') ||
    location.pathname.includes('/historial-ventas') ||
    location.pathname.includes('/cotizaciones') ||
    location.pathname.includes('/devoluciones')
  );
  const [inventarioExpanded, setInventarioExpanded] = useState(
    location.pathname.includes('/inventario') ||
    location.pathname.includes('/ordenes-compra')
  );
  const [contactosExpanded, setContactosExpanded] = useState(
    location.pathname.includes('/clientes') ||
    location.pathname.includes('/proveedores')
  );
  const [cajaExpanded, setCajaExpanded] = useState(
    location.pathname.includes('/cierre-caja') ||
    location.pathname.includes('/retiros-caja')
  );
  const [sistemaExpanded, setSistemaExpanded] = useState(
    location.pathname.includes('/logs') ||
    location.pathname.includes('/auditoria') ||
    location.pathname.includes('/monitoreo')
  );

  const [versionInfo, setVersionInfo] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const { data } = await API.get('/version');
        setVersionInfo(data);
      } catch (err) {
        console.warn('Could not fetch version info:', err.message);
        setVersionInfo({ version: '1.6.5', commit: 'unknown' });
      }
    };
    fetchVersion();
  }, []);

  const handleExpand = (setter, value) => {
    setter(!value);
  };

  const renderNavItem = (item, nested = false) => {
    const isActive = location.pathname === item.path;

    return (
      <ListItemButton
        key={item.path}
        component={NavLink}
        to={item.path}
        selected={isActive}
        sx={{
          pl: nested ? 4 : 2,
          borderRadius: 2,
          mb: 0.5,
          mx: 1,
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '& .MuiListItemIcon-root': {
              color: 'inherit',
            },
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'inherit' : 'text.secondary' }}>
          <item.icon size={20} />
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 400 }}
        />
        {item.shortcut && shortcutsEnabled && (
          <Typography variant="caption" sx={{ color: isActive ? 'inherit' : 'text.disabled', border: 1, borderColor: 'divider', borderRadius: 1, px: 0.5 }}>
            {item.shortcut}
          </Typography>
        )}
      </ListItemButton>
    );
  };

  const renderExpandableSection = (title, icon, expanded, setExpanded, items) => {
    const Icon = icon;
    return (
      <>
        <ListItemButton
          onClick={() => handleExpand(setExpanded, expanded)}
          sx={{ borderRadius: 2, mb: 0.5, mx: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Icon size={20} />
          </ListItemIcon>
          <ListItemText primary={title} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </ListItemButton>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {items.map(item => renderNavItem(item, true))}
          </List>
        </Collapse>
      </>
    );
  };

  // Data definitions
  const mainItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
  ];

  const ventasSections = [
    { path: '/facturacion', icon: ShoppingCart, label: 'Nueva Factura', shortcut: 'Ctrl+B' },
    { path: '/historial-ventas', icon: Receipt, label: 'Historial', shortcut: 'Ctrl+H' },
    { path: '/cotizaciones', icon: FileText, label: 'Cotizaciones' },
    { path: '/devoluciones', icon: RefreshCw, label: 'Devoluciones' },
  ];

  const inventarioSections = [
    { path: '/inventario', icon: Package, label: 'Productos', shortcut: 'Ctrl+I' },
    { path: '/ordenes-compra', icon: ClipboardList, label: 'Órdenes de Compra' },
  ];

  const contactosSections = [
    { path: '/clientes', icon: Users, label: 'Clientes', shortcut: 'Ctrl+C' },
    { path: '/proveedores', icon: Truck, label: 'Proveedores' },
  ];

  const cajaSections = [
    { path: '/cierre-caja', icon: DollarSign, label: 'Cierre de Caja' },
    { path: '/retiros-caja', icon: Receipt, label: 'Retiros de Caja' },
  ];

  const sistemaSections = [
    { path: '/logs', icon: Activity, label: 'Logs Técnicos' },
    { path: '/auditoria', icon: Shield, label: 'Auditoría de Usuario' },
    { path: '/monitoreo', icon: Activity, label: 'Monitoreo en Tiempo Real' },
  ];

  const adminItems = [
    { path: '/reportes', icon: BarChart3, label: 'Reportes', shortcut: 'Ctrl+R' },
    { path: '/usuarios', icon: UserCog, label: 'Usuarios' },
  ];

  const configSections = [
    { path: '/configuracion/negocio', icon: Building2, label: 'Negocio', shortcut: 'Ctrl+,' },
    { path: '/configuracion/sistema', icon: Globe, label: 'Sistema' },
    { path: '/configuracion/notificaciones', icon: Bell, label: 'Notificaciones' },
    { path: '/configuracion/facturacion', icon: CreditCard, label: 'Facturación' },
    { path: '/configuracion/integraciones', icon: Cloud, label: 'Integraciones' },
  ].filter(section => !section.developerOnly || isDeveloper);

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper', // Or use 'background.default' based on preference
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          {settings.businessLogoUrl && settings.businessLogoUrl !== '/logo.png' && settings.businessLogoUrl !== '/default-logo.png' ? (
            <Avatar
              src={settings.businessLogoUrl}
              alt={settings.businessName || 'Logo'}
              sx={{ width: 64, height: 64, borderRadius: 2, mb: 1 }}
              variant="rounded"
            />
          ) : (
            <Avatar
              variant="rounded"
              sx={{ width: 64, height: 64, mb: 1, bgcolor: 'primary.main' }}
            >
              <FileText size={32} />
            </Avatar>
          )}
          <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
            MECANET
          </Typography>
          {versionInfo && (
            <Chip
              label={`v${versionInfo.version}`}
              size="small"
              onClick={() => setShowVersionModal(true)}
              sx={{ mt: 1, height: 20, fontSize: '0.65rem', cursor: 'pointer' }}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Navigation */}
        <List component="nav" sx={{ flexGrow: 1, overflowY: 'auto', pt: 2 }}>
          {mainItems.map(item => renderNavItem(item))}

          {renderExpandableSection('Ventas', Receipt, ventasExpanded, setVentasExpanded, ventasSections)}
          {renderExpandableSection('Inventario', Package, inventarioExpanded, setInventarioExpanded, inventarioSections)}
          {renderExpandableSection('Contactos', Users, contactosExpanded, setContactosExpanded, contactosSections)}
          {renderExpandableSection('Caja', DollarSign, cajaExpanded, setCajaExpanded, cajaSections)}

          {canSeeAdminMenu && (
            <>
              <Divider sx={{ my: 2, mx: 2 }} />
              <Typography variant="caption" sx={{ px: 3, color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Administración
              </Typography>

              {adminItems.map(item => renderNavItem(item))}

              {isDeveloper && renderExpandableSection('Sistema', Activity, sistemaExpanded, setSistemaExpanded, sistemaSections)}

              {renderExpandableSection('Configuración', Settings, configExpanded, setConfigExpanded, configSections)}
            </>
          )}
        </List>

        {/* Shortcuts Hint */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<HelpCircle size={16} />}
            onClick={() => document.dispatchEvent(new CustomEvent('open-shortcuts-help'))}
            sx={{ textTransform: 'none', color: 'text.secondary', borderColor: 'divider' }}
          >
            Ver atajos (?)
          </Button>
        </Box>

        {/* User Info */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap fontWeight="medium">
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {user?.role}
            </Typography>
          </Box>
        </Box>
      </Drawer>

      {/* Version Modal */}
      <Dialog open={showVersionModal} onClose={() => setShowVersionModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Package size={24} />
          MECANET <Typography component="span" variant="caption" sx={{ ml: 1 }}>v{versionInfo?.version}</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Novedades</Typography>
            <Typography variant="body2" color="text.secondary">
              {versionInfo?.releaseNotes || 'Sin notas de versión.'}
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" display="block" color="text.secondary">
              Última actualización: {versionInfo?.lastUpdated}
            </Typography>
            {versionInfo?.commit && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                Commit: {versionInfo.commit}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', bgcolor: 'success.light', p: 1, borderRadius: 1, bgOpacity: 0.1 }}>
            <CheckCircle2 size={16} />
            <Typography variant="caption" color="success.dark">Sistema actualizado.</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersionModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;
