import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Typography,
  Divider,
  ListItemIcon,
  Switch,
  Paper,
  List,
  ListItem,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Mail as MailIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const Topbar = ({ onMenuClick, mode, toggleTheme }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotifMenu = (event) => {
    setAnchorElNotif(event.currentTarget);
  };

  const handleCloseNotifMenu = () => {
    setAnchorElNotif(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleCloseUserMenu();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: theme.shadows[2],
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
          >
            <MenuIcon />
          </IconButton>

          {/* Search bar */}
          <Paper
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              width: 400,
              px: 2,
              py: 0.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
            elevation={0}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase
              placeholder="Rechercher des documents..."
              fullWidth
              sx={{ fontSize: 14 }}
            />
          </Paper>
        </Box>

        {/* Right section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Mail icon */}
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <MailIcon />
            </Badge>
          </IconButton>

          {/* Fullscreen toggle */}
          <IconButton color="inherit" onClick={toggleFullscreen}>
            <FullscreenIcon />
          </IconButton>

          {/* Notifications */}
          <IconButton color="inherit" onClick={handleOpenNotifMenu}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Theme toggle */}
          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {/* User menu */}
          <IconButton onClick={handleOpenUserMenu}>
            <Avatar 
              src={user?.picture}
              sx={{ 
                width: 36, 
                height: 36,
                bgcolor: 'primary.main'
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Box>

        {/* Notifications Menu */}
        <Menu
          anchorEl={anchorElNotif}
          open={Boolean(anchorElNotif)}
          onClose={handleCloseNotifMenu}
          PaperProps={{
            sx: {
              width: 360,
              maxHeight: 480,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Typography 
                variant="caption" 
                sx={{ color: 'primary.main', cursor: 'pointer' }}
                onClick={markAllAsRead}
              >
                Tout marquer comme lu
              </Typography>
            )}
          </Box>
          <Divider />
          <List sx={{ p: 0 }}>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="Aucune notification"
                  sx={{ textAlign: 'center', color: 'text.secondary' }}
                />
              </ListItem>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <ListItem 
                  key={notif.id} 
                  button
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.documentId) {
                      navigate(`/documents/${notif.documentId}`);
                    }
                    handleCloseNotifMenu();
                  }}
                  sx={{
                    bgcolor: notif.read ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
                  }}
                >
                  <ListItemText 
                    primary={notif.message}
                    secondary={notif.timestamp ? new Date(notif.timestamp).toLocaleString('fr-FR') : ''}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Menu>

        {/* User Menu */}
        <Menu
          anchorEl={anchorElUser}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          PaperProps={{
            sx: {
              width: 220,
              mt: 1.5,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2">{user?.name || 'Utilisateur'}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.email || 'email@example.com'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { navigate('/settings'); handleCloseUserMenu(); }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Paramètres
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Déconnexion
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;

