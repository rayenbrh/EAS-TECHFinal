import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Typography,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DocumentIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'user', 'guest'] },
  { text: 'Projets', icon: <FolderIcon />, path: '/projects', roles: ['admin', 'user', 'guest'] },
  { text: 'Documents', icon: <DocumentIcon />, path: '/documents', roles: ['admin', 'user'] },
  { text: 'Utilisateurs', icon: <PeopleIcon />, path: '/users', roles: ['admin'] },
  { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings', roles: ['admin', 'user'] },
];

const Sidebar = ({ open, onClose, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, hasRole } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || hasRole(item.roles)
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo et titre */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 2,
          }}
        >
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            M
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Master Admin
        </Typography>
      </Box>

      <Divider />

      {/* Profil utilisateur */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Bienvenue
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={user?.picture}
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: 'primary.main'
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {user?.name || 'Utilisateur'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.email || user?.role || 'Invité'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Menu */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            px: 3, 
            color: 'text.secondary',
            fontWeight: 600,
            display: 'block',
            mb: 1
          }}
        >
          MENU
        </Typography>
        <List>
          {filteredMenuItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ px: 2 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Master Admin Dashboard
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
          © 2024 Tous droits réservés
        </Typography>
      </Box>
    </Box>
  );

  return isMobile ? (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  ) : (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;

