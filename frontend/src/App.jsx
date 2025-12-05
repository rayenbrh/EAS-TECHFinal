import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import Projects from './pages/Projects';
import ProjectDocuments from './pages/ProjectDocuments';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Settings from './pages/Settings';
import OIDCCallback from './pages/OIDCCallback';
import MainLayout from './components/Layout/MainLayout';

function App() {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'dark';
  });

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#6200ea',
            light: '#9d46ff',
            dark: '#0a00b6',
          },
          secondary: {
            main: '#03dac6',
            light: '#66fff9',
            dark: '#00a896',
          },
          error: {
            main: '#cf6679',
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#fafafa',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
          success: {
            main: '#4caf50',
          },
          warning: {
            main: '#ff9800',
          },
          info: {
            main: '#2196f3',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 600,
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
          },
          h6: {
            fontSize: '1rem',
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'dark' 
                  ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
                  : '0 2px 4px rgba(0, 0, 0, 0.1)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<OIDCCallback />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <MainLayout mode={mode} toggleTheme={toggleTheme} />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:projectId/documents" element={<ProjectDocuments />} />
                  <Route path="projects/:projectId/analytics" element={<Analytics />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="documents/:id" element={<DocumentView />} />
                  <Route path="users" element={<Users />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;

