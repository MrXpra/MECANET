import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { login as loginAPI } from '../services/api';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import useIsChristmas from '../hooks/useIsChristmas';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  Container,
  useTheme,
  Avatar
} from '@mui/material';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();
  const { settings } = useSettingsStore();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isChristmas = useIsChristmas();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginAPI(formData);
      const { token, ...user } = response.data;

      setAuth(user, token);
      toast.success(`¡Bienvenido, ${user.name}!`);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        background: isChristmas
          ? 'url(/assets/images/santa-login-bg.jpg) center/cover no-repeat'
          : 'linear-gradient(135deg, #2563eb 0%, #9333ea 50%, #ec4899 100%)',
      }}
    >
      {/* Overlay for Christmas BG */}
      {isChristmas && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 0
          }}
        />
      )}

      {/* Standard Background Elements (if not Christmas) */}
      {!isChristmas && (
        <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <Box
            sx={{
              position: 'absolute',
              top: -16,
              left: -16,
              width: 288,
              height: 288,
              borderRadius: '50%',
              bgcolor: '#d8b4fe', // purple-300
              mixBlendMode: 'multiply',
              filter: 'blur(40px)',
              opacity: 0.7,
              animation: 'blob 7s infinite',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: -16,
              right: -16,
              width: 288,
              height: 288,
              borderRadius: '50%',
              bgcolor: '#fde047', // yellow-300
              mixBlendMode: 'multiply',
              filter: 'blur(40px)',
              opacity: 0.7,
              animation: 'blob 7s infinite 2s',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -32,
              left: 80,
              width: 288,
              height: 288,
              borderRadius: '50%',
              bgcolor: '#f9a8d4', // pink-300
              mixBlendMode: 'multiply',
              filter: 'blur(40px)',
              opacity: 0.7,
              animation: 'blob 7s infinite 4s',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                                 linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </Box>
      )}

      <AnimatedBackground />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 10 }}>
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'background.paper',
                borderRadius: 2,
                mx: 'auto',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 3,
                overflow: 'hidden'
              }}
            >
              {settings.businessLogoUrl && settings.businessLogoUrl !== '/logo.png' && settings.businessLogoUrl !== '/default-logo.png' ? (
                <img
                  src={settings.businessLogoUrl}
                  alt={settings.businessName || 'Logo'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <Box
                sx={{
                  display: (settings.businessLogoUrl && settings.businessLogoUrl !== '/logo.png' && settings.businessLogoUrl !== '/default-logo.png') ? 'none' : 'flex',
                  color: 'primary.main'
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </Box>
            </Box>
            <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary" gutterBottom>
              {settings.businessName || 'MECANET'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistema de Punto de Venta
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="usuario@ejemplo.com"
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="••••••••"
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                py: 1.5,
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: 4
              }}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LogIn size={20} />}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Box>

          {/* Demo Credentials Info - Solo en desarrollo */}
          {import.meta.env.DEV && (
            <Paper
              variant="outlined"
              sx={{
                mt: 3,
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(37, 99, 235, 0.05)',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(37, 99, 235, 0.2)',
              }}
            >
              <Typography variant="caption" fontWeight="bold" color="primary.main" display="block" gutterBottom>
                Credenciales de prueba:
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                Admin: admin@admin.com / 123456
              </Typography>
            </Paper>
          )}
        </Paper>

        <Typography variant="body2" align="center" sx={{ mt: 4, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          © 2025 MECANET. Todos los derechos reservados.
        </Typography>
      </Container>
    </Box>
  );
};

export default Login;
