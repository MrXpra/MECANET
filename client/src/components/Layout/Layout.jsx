import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AnimatedBackground from '../AnimatedBackground';
import { useSettingsStore } from '../../store/settingsStore';
import { getSettings } from '../../services/api';

const DRAWER_WIDTH = 260;

const Layout = () => {
  const { setSettings } = useSettingsStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Cargar settings al montar el componente
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getSettings();
        setSettings(response.data);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    };

    loadSettings();
  }, [setSettings]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Top Bar */}
      <TopBar drawerWidth={DRAWER_WIDTH} />

      {/* Sidebar */}
      <Sidebar drawerWidth={DRAWER_WIDTH} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
