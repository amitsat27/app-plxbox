/**
 * Notification System for Pulsebox
 * Integrates with Firebase Cloud Messaging and Local Notifications
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';
import { trackAnalyticsEvent } from '../config/firebaseConfig';

const isExpoGo = Constants.appOwnership === 'expo';

interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  type: 'bill' | 'alert' | 'system' | 'payment';
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
}

interface NotificationContextType {
  notificationCount: number;
  notifications: NotificationMessage[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  sendNotification: (notification: Omit<NotificationMessage, 'id' | 'read' | 'timestamp'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!isExpoGo) {
      requestNotificationPermissions();
    }
  }, []);

  useEffect(() => {
    if (isExpoGo) return;

    const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
      handleNotificationReceived(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
      } else {
        console.log('Notification permissions granted');
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  const handleNotificationReceived = (notification: Notifications.Notification) => {
    const newNotification: NotificationMessage = {
      id: notification.request.identifier,
      title: notification.request.content.title || 'Notification',
      body: notification.request.content.body || '',
      type: (notification.request.content.data?.type as any) || 'system',
      read: false,
      timestamp: new Date(),
      actionUrl: notification.request.content.data?.actionUrl as string | undefined,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    updateUnreadCount();
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const actionUrl = response.notification.request.content.data?.actionUrl;
    if (actionUrl) {
      console.log('User tapped notification with URL:', actionUrl);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    updateUnreadCount();
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    updateUnreadCount();
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    updateUnreadCount();
  };

  const sendNotification = async (notification: Omit<NotificationMessage, 'id' | 'read' | 'timestamp'>) => {
    try {
      const newId = `${Date.now()}`;
      const newNotification: NotificationMessage = {
        id: newId,
        ...notification,
        read: false,
        timestamp: new Date(),
      };

      setNotifications((prev) => [newNotification, ...prev]);
      updateUnreadCount();

      if (!isExpoGo) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: {
              type: notification.type,
              actionUrl: notification.actionUrl,
            },
            badge: unreadCount + 1,
          },
          trigger: { type: 'timeInterval', seconds: 1 } as any,
        });
      }

      await trackAnalyticsEvent('notification_sent', {
        type: notification.type,
        userId: user?.uid,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const updateUnreadCount = () => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  };

  return (
    <NotificationContext.Provider
      value={{
        notificationCount: notifications.length,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
