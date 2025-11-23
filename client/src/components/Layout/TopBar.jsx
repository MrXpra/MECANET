import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProfile } from '../../services/api';
import ClockWidget from '../ClockWidget';
import WeatherWidget from '../WeatherWidget';

const TopBar = ({ drawerWidth }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout, setAuth, updateUser } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { settings } = useSettingsStore();

  const [anchorEl, setAnchorEl] = useState(null);
  const [updatingShortcuts, setUpdatingShortcuts] = useState(false);

  const shortcutsActive = user?.shortcutsEnabled !== false;
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleShortcutToggle = async () => {
    if (!user) return;
    const nextValue = !shortcutsActive;
    try {
      setUpdatingShortcuts(true);
      const response = await updateProfile({ shortcutsEnabled: nextValue });
      const { token, ...profile } = response.data;
      if (token) {
        setAuth(profile, token);
      } else {
        updateUser(profile);
      }
      toast.success(nextValue ? 'Atajos activados' : 'Atajos desactivados');
    } catch (error) {
      console.error('Error al actualizar atajos:', error);
      const message = error.response?.data?.message || 'No se pudo actualizar la preferencia';
      toast.error(message);
    } finally {
      setUpdatingShortcuts(false);
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
        backgroundImage: 'none'
      }}
    >
      <Toolbar>
        {/* Business Name */}
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {settings.businessName || 'MECANET'}
        </Typography>

        {/* Right Side Widgets */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ClockWidget />

          {settings.showWeather && settings.weatherApiKey && (
            <WeatherWidget
              location={settings.weatherLocation || 'Santo Domingo,DO'}
              apiKey={settings.weatherApiKey}
            />
          )}

          <Tooltip title={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}>
            <IconButton onClick={toggleTheme} color="inherit">
              {isDarkMode ? <Sun size={20} color="#eab308" /> : <Moon size={20} />}
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Box>
            <Tooltip title="Menú de usuario">
              <IconButton
                onClick={handleMenuClick}
                size="small"
                sx={{ ml: 1 }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Avatar
                  sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <ChevronDown size={16} style={{ marginLeft: 4 }} />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={open}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" noWrap>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
              </Box>
              <Divider />

              <MenuItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={shortcutsActive}
                      onChange={(e) => {
                        e.stopPropagation(); // Prevent menu close
                        handleShortcutToggle();
                      }}
                      disabled={updatingShortcuts}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Atajos de teclado</Typography>}
                  labelPlacement="start"
                  sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                />
              </MenuItem>

              <Divider />

              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <LogOut size={20} color={theme.palette.error.main} />
                </ListItemIcon>
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
