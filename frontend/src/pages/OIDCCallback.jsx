import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const OIDCCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // Attendre un peu avant de rediriger pour afficher l'erreur
      setTimeout(() => {
        navigate(`/login?error=${error}`, { replace: true });
      }, 2000);
      return;
    }

    if (token) {
      const result = loginWithToken(token);
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate(`/login?error=token_invalide`, { replace: true });
      }
    } else {
      navigate('/login?error=token_manquant', { replace: true });
    }
  }, [searchParams, loginWithToken, navigate]);

  const error = searchParams.get('error');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erreur d'authentification: {error}
        </Alert>
      ) : (
        <>
          <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white' }}>
            Authentification en cours...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default OIDCCallback;
