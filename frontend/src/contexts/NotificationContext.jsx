import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const newSocket = io(API_URL, {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connecté');
      });

      newSocket.on('notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        enqueueSnackbar(notification.message, {
          variant: notification.type || 'info',
          autoHideDuration: 5000,
        });
      });

      newSocket.on('document:uploaded', (data) => {
        const notification = {
          id: Date.now(),
          type: 'success',
          message: `Nouveau document: ${data.filename}`,
          timestamp: new Date(),
          read: false,
        };
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        enqueueSnackbar(notification.message, {
          variant: 'success',
        });
      });

      newSocket.on('document:summary', (data) => {
        const notification = {
          id: Date.now(),
          type: 'info',
          message: `Résumé IA généré pour: ${data.filename}`,
          timestamp: new Date(),
          read: false,
          documentId: data.id,
        };
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        enqueueSnackbar(notification.message, {
          variant: 'info',
        });
      });

      newSocket.on('user:role_changed', (data) => {
        const notification = {
          id: Date.now(),
          type: 'info',
          message: `Votre rôle a été modifié: ${data.role}`,
          timestamp: new Date(),
          read: false,
        };
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        enqueueSnackbar(notification.message, {
          variant: 'info',
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user, enqueueSnackbar]);

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

