import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { useThemeStore } from '../store/themeStore';
import { useMemo } from 'react';

export const AppTheme = ({ children }) => {
    const { isDarkMode } = useThemeStore();

    const theme = useMemo(() => createTheme({
        palette: {
            mode: isDarkMode ? 'dark' : 'light',
            primary: {
                main: '#2563eb', // blue-600
                light: '#60a5fa', // blue-400
                dark: '#1d4ed8', // blue-700
                contrastText: '#ffffff',
            },
            secondary: {
                main: '#4b5563', // gray-600
                light: '#9ca3af', // gray-400
                dark: '#1f2937', // gray-800
                contrastText: '#ffffff',
            },
            background: {
                default: isDarkMode ? '#111827' : '#f9fafb', // gray-900 : gray-50
                paper: isDarkMode ? '#1f2937' : '#ffffff', // gray-800 : white
            },
            text: {
                primary: isDarkMode ? '#f3f4f6' : '#111827', // gray-100 : gray-900
                secondary: isDarkMode ? '#9ca3af' : '#4b5563', // gray-400 : gray-600
            },
        },
        typography: {
            fontFamily: '"Inter", "system-ui", "sans-serif"',
            h1: { fontWeight: 700 },
            h2: { fontWeight: 600 },
            h3: { fontWeight: 600 },
            button: { textTransform: 'none', fontWeight: 500 },
        },
        shape: {
            borderRadius: 8,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        },
                    },
                    containedPrimary: {
                        '&:hover': {
                            backgroundColor: '#1d4ed8', // blue-700
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none', // Remove default gradient in dark mode
                        boxShadow: isDarkMode
                            ? '0 4px 6px -1px rgb(0 0 0 / 0.3)'
                            : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiTextField: {
                defaultProps: {
                    variant: 'outlined',
                    size: 'small',
                },
            },
            MuiInputBase: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    },
                },
            },
        },
    }), [isDarkMode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};
