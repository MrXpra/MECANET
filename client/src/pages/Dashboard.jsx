import { useState, useEffect } from 'react';
import {
  getAllDashboardData,
} from '../services/api';
import toast from 'react-hot-toast';
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Info,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Tooltip,
  IconButton,
  useTheme,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesByDay, setSalesByDay] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesByPayment, setSalesByPayment] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await getAllDashboardData();
      const data = response.data;

      setStats(data.stats);
      setSalesByDay(data.salesByDay);
      setTopProducts(data.topProducts);
      const preferredOrder = ['Efectivo', 'Tarjeta', 'Transferencia'];
      const normalizedPayments = (data.salesByPayment || []).map((entry) => ({
        ...entry,
        name: entry.name || entry._id || 'Desconocido'
      }));

      normalizedPayments.sort((a, b) => {
        const aIndex = preferredOrder.indexOf(a.name);
        const bIndex = preferredOrder.indexOf(b.name);
        if (aIndex === -1 && bIndex === -1) {
          return a.name.localeCompare(b.name);
        }
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      setSalesByPayment(normalizedPayments);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(value);
  };

  const COLORS = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
  ];

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '12px',
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          pointerEvents: 'none'
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} md={6} lg={3} key={i}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
        <Grid item xs={12} lg={6}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </Grid>
      </Grid>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3} sx={{ width: '100%' }}>
        {/* KPI Cards */}
        <Grid item xs={12} md={6} lg={3}>
          <KPICard
            title="Ventas de Hoy"
            tooltip="Total de ingresos generados hoy incluyendo todos los métodos de pago"
            value={formatCurrency(stats?.today?.total || 0)}
            icon={DollarSign}
            color="primary"
            subtitle={`${stats?.today?.transactions || 0} transacciones`}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <KPICard
            title="Venta Promedio"
            value={formatCurrency(stats?.today?.avgTicket || 0)}
            icon={TrendingUp}
            color="success"
            subtitle="Por transacción hoy"
            tooltip="Monto promedio por cada venta realizada hoy"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <KPICard
            title="Productos"
            value={stats?.inventory?.totalProducts || 0}
            icon={Package}
            color="secondary"
            subtitle={`${stats?.inventory?.lowStockProducts || 0} con bajo stock`}
            tooltip="Total de productos registrados en el inventario"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <KPICard
            title="Clientes"
            value={stats?.customers || 0}
            icon={Users}
            color="warning"
            subtitle="Registrados"
            tooltip="Número total de clientes registrados"
          />
        </Grid>

        {/* Charts Row */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Ventas de la Última Semana
                </Typography>
                <Tooltip title="Muestra el total de ventas diarias de los últimos 7 días">
                  <IconButton size="small">
                    <HelpCircle size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <AreaChart data={salesByDay}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="date"
                      stroke={theme.palette.text.secondary}
                      fontSize={12}
                      tickMargin={10}
                    />
                    <YAxis
                      stroke={theme.palette.text.secondary}
                      fontSize={12}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        borderRadius: 8,
                        color: theme.palette.text.primary
                      }}
                      formatter={(value) => [formatCurrency(value), 'Ventas']}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      fill="url(#colorTotal)"
                      name="Total de Ventas"
                      dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Ventas por Método de Pago
                </Typography>
                <Tooltip title="Distribución de ventas de los últimos 30 días por método de pago">
                  <IconButton size="small">
                    <HelpCircle size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={salesByPayment}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={100}
                      innerRadius={50}
                      dataKey="total"
                      nameKey="name"
                      paddingAngle={3}
                    >
                      {salesByPayment.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke={theme.palette.background.paper}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        borderRadius: 8,
                        color: theme.palette.text.primary
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {salesByPayment.map((payment, index) => (
                  <Grid item xs={4} key={index}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: COLORS[index % COLORS.length],
                          mx: 'auto',
                          mb: 1
                        }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        {payment.name}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(payment.total)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Bottom Row */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Productos Más Vendidos (30 días)
              </Typography>
              <List disablePadding>
                {topProducts.map((product, index) => (
                  <Box key={product._id}>
                    <ListItem disableGutters alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 32, height: 32, fontSize: '0.875rem' }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={product.name}
                        secondary={product.sku}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {product.totalQuantity} unid.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(product.totalRevenue)}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < topProducts.length - 1 && <Divider variant="inset" component="li" />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AlertTriangle size={20} color={theme.palette.warning.main} />
                <Typography variant="h6" fontWeight="bold">
                  Productos con Bajo Stock
                </Typography>
              </Box>
              <List disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
                {stats?.inventory?.lowStockItems?.map((product, index) => (
                  <Box key={product._id}>
                    <ListItem
                      disableGutters
                      sx={{
                        p: 1,
                        mb: 1,
                        bgcolor: 'warning.light',
                        borderRadius: 1,
                        bgOpacity: 0.1, // Note: bgOpacity not valid in sx directly, use alpha color
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 247, 237, 1)'
                      }}
                    >
                      <ListItemText
                        primary={product.name}
                        secondary={product.sku}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="warning.main" fontWeight="bold">
                          {product.stock}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          en stock
                        </Typography>
                      </Box>
                    </ListItem>
                  </Box>
                ))}
                {stats?.inventory?.lowStockItems?.length === 0 && (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No hay productos con bajo stock
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const KPICard = ({ title, value, icon: Icon, color, subtitle, tooltip }) => {
  const theme = useTheme();

  // Map color prop to theme palette
  const getColor = (colorName) => {
    switch (colorName) {
      case 'blue': return theme.palette.primary.main;
      case 'green': return theme.palette.success.main;
      case 'purple': return theme.palette.secondary.main;
      case 'orange': return theme.palette.warning.main;
      default: return theme.palette[colorName]?.main || theme.palette.primary.main;
    }
  };

  const mainColor = getColor(color);

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              {tooltip && (
                <Tooltip title={tooltip}>
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <Info size={14} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: mainColor,
              width: 48,
              height: 48,
              boxShadow: 3
            }}
          >
            <Icon size={24} color="#fff" />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
