import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

const Settings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      documentUpload: true,
      aiSummary: true,
    },
    profile: {
      name: 'Joan Wilkins',
      email: 'joan@example.com',
      phone: '+33 6 12 34 56 78',
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
    },
  });

  const handleSave = () => {
    enqueueSnackbar('Paramètres sauvegardés avec succès', { variant: 'success' });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Paramètres
      </Typography>

      <Grid container spacing={3}>
        {/* Profil */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <PaletteIcon color="primary" />
                <Typography variant="h6">Profil</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={settings.profile.name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profile: { ...settings.profile, name: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profile: { ...settings.profile, email: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={settings.profile.phone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profile: { ...settings.profile, phone: e.target.value },
                      })
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6">Notifications</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            email: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Notifications par email"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.push}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            push: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Notifications push"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.documentUpload}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            documentUpload: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Téléchargement de documents"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.aiSummary}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            aiSummary: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Résumés IA"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sécurité */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Sécurité</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.twoFactor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            twoFactor: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Authentification à deux facteurs"
                />
                <TextField
                  fullWidth
                  label="Délai d'expiration de session (minutes)"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        sessionTimeout: parseInt(e.target.value),
                      },
                    })
                  }
                />
                <Divider sx={{ my: 1 }} />
                <Button variant="outlined" color="warning">
                  Changer le mot de passe
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Informations Système de gestion documentaire */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration Document Store
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Le système de gestion documentaire est accessible à l'adresse: http://localhost:8082
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="URL de l'API Document Store"
                    defaultValue="http://localhost:8082/api"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Token API"
                    type="password"
                    defaultValue="************************"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Bouton de sauvegarde */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Sauvegarder les paramètres
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;

