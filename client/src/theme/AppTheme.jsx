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
                default: isDarkMode ? '#0f172a' : '#f9fafb', // slate-900
                paper: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', // slate-800 with opacity
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
            borderRadius: 12, // More modern rounded corners
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        boxShadow: 'none',
                        borderRadius: 8,
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
                        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
                        backdropFilter: isDarkMode ? 'blur(12px)' : 'none',
                        boxShadow: isDarkMode
                            ? '0 4px 6px -1px rgb(0 0 0 / 0.3)'
                            : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backdropFilter: isDarkMode ? 'blur(12px)' : 'none',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.12)',
                    },
                    head: {
                        fontWeight: 600,
                        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : '#f9fafb',
                    },
                },
            },
            MuiTextField: {
                defaultProps: {
                    variant: 'outlined',
                    size: 'small',
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.5)' : '#ffffff',
                        '& fieldset': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover fieldset': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.87)',
                        },
                    },
                },
            },
            MuiInputBase: {
                styleOverrides: {
                    root: {
                        // backgroundColor handled in OutlinedInput
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
