import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { DeviceEventEmitter } from 'react-native';
import { appEventEmitter, AppEvent } from '@/utils/eventEmitter';
import { 
  Notification, 
  NotificationContextType, 
  DEFAULT_NOTIFICATION_CONFIG,
  MarketplaceEventData,
  UserRegistryEventData
} from '@/types/notifications';
import { NotificationService } from '@/services/notifications/NotificationService';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const activeAccount = useActiveAccount();
  const notificationService = useRef(new NotificationService());

  /**
   * Add a new notification to the list
   */
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
    } as Notification;
    
    setNotifications(prev => {
      // Limit maximum notifications
      const updated = [newNotification, ...prev];
      return updated.slice(0, DEFAULT_NOTIFICATION_CONFIG.maxNotifications);
    });
    
    console.log('📱 Added notification:', newNotification.type, newNotification.title);
    
    // Auto-remove notification after configured delay if no onDismiss callback
    if (!notification.onDismiss) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, DEFAULT_NOTIFICATION_CONFIG.autoRemoveDelay);
    }
  };

  /**
   * Remove a notification by ID
   */
  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification?.onDismiss) {
        notification.onDismiss();
      }
      return prev.filter(n => n.id !== id);
    });
    console.log('🗑️ Removed notification:', id);
  };

  /**
   * Clear all notifications
   */
  const clearNotifications = () => {
    setNotifications([]);
    console.log('🧹 Cleared all notifications');
  };

  /**
   * Clear old notifications (older than event time window)
   */
  const clearOldNotifications = () => {
    const now = Date.now();
    setNotifications(prev => {
      const filtered = prev.filter(notification => {
        if (!notification.eventTimestamp) return true; // Keep if no event timestamp
        
        const eventTime = notification.eventTimestamp * 1000; // Convert to milliseconds
        const timeDiff = now - eventTime;
        return timeDiff <= DEFAULT_NOTIFICATION_CONFIG.eventTimeWindow;
      });
      
      const removedCount = prev.length - filtered.length;
      if (removedCount > 0) {
        console.log(`🕐 Removed ${removedCount} old notifications`);
      }
      
      return filtered;
    });
  };

  /**
   * Update seller balance with optimized retry logic
   */
  const updateSellerBalance = () => {
    console.log('🔄 Updating seller balance after NFT sale...');
    
    // Immediate update
    DeviceEventEmitter.emit('refreshWalletData');
    
    // Single retry after 1 second
    setTimeout(() => {
      DeviceEventEmitter.emit('refreshWalletData');
      DeviceEventEmitter.emit('refreshTreesData');
      DeviceEventEmitter.emit('refreshMarketplaceData');
    }, 1000);
  };

  /**
   * Update social data with optimized retry logic
   */
  const updateSocialData = () => {
    console.log('🔄 Updating social data after friend event...');
    
    // Immediate update
    DeviceEventEmitter.emit('refreshSocialData');
    
    // Single retry after 1 second
    setTimeout(() => {
      DeviceEventEmitter.emit('refreshSocialData');
    }, 1000);
  };

  /**
   * Handle marketplace events
   */
  const handleMarketplaceEvent = async (data: MarketplaceEventData) => {
    if (!activeAccount?.address) return;

    try {
      const notification = await notificationService.current.processMarketplaceEvent(
        data, 
        activeAccount.address
      );

             if (notification) {
         // Override onDismiss to trigger balance update
         if (notification.type === 'nft_sold') {
           (notification as any).onDismiss = updateSellerBalance;
         }
         
         addNotification(notification);
      }
    } catch (error) {
      console.error('Error processing marketplace event:', error);
    }
  };

  /**
   * Handle user registry events
   */
  const handleUserRegistryEvent = async (data: UserRegistryEventData) => {
    if (!activeAccount?.address) return;

    try {
      const notification = await notificationService.current.processUserRegistryEvent(
        data,
        activeAccount.address
      );

             if (notification) {
         // Override onDismiss to trigger social data update
         if (notification.type === 'friend_request_received' || 
             notification.type === 'friend_request_accepted') {
           (notification as any).onDismiss = updateSocialData;
         }
         
         addNotification(notification);
      }

      // Always update social data for friend events involving the user
      const userAddress = activeAccount.address.toLowerCase();
      const { eventType, from, to, user1, user2 } = data;

      if (eventType === 'FriendRequestAccepted' || eventType === 'FriendAdded') {
        const isUserInvolved = 
          (from && from.toLowerCase() === userAddress) ||
          (to && to.toLowerCase() === userAddress) ||
          (user1 && user1.toLowerCase() === userAddress) ||
          (user2 && user2.toLowerCase() === userAddress);

        if (isUserInvolved) {
          updateSocialData();
        }
      }
    } catch (error) {
      console.error('Error processing user registry event:', error);
    }
  };

  /**
   * Listen to internal app events
   */
  useEffect(() => {
    const handleAppEvent = async (event: AppEvent) => {
      if (!activeAccount?.address) return;

      switch (event.type) {
        case 'MARKETPLACE_EVENT':
          await handleMarketplaceEvent(event.data as MarketplaceEventData);
          break;

        case 'USER_REGISTRY_EVENT':
          await handleUserRegistryEvent(event.data as UserRegistryEventData);
          break;

                 default:
           console.warn('Unknown app event type:', (event as any).type);
      }
    };

    const unsubscribe = appEventEmitter.subscribe(handleAppEvent);
    return unsubscribe;
  }, [activeAccount?.address]);

  /**
   * Cleanup old notifications and processed transactions periodically
   */
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      clearOldNotifications();
      notificationService.current.clearOldProcessedTransactions();
    }, DEFAULT_NOTIFICATION_CONFIG.cleanupInterval);

    return () => clearInterval(cleanupInterval);
  }, []);

  /**
   * Clear notifications when user disconnects
   */
  useEffect(() => {
    if (!activeAccount?.address) {
      clearNotifications();
    }
  }, [activeAccount?.address]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications,
      clearOldNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 