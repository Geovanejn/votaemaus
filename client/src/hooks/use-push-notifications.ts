import { useState, useCallback, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

type PermissionState = 'default' | 'granted' | 'denied';

interface PushNotificationState {
  isSupported: boolean;
  permission: PermissionState;
  isSubscribed: boolean;
  isSubscribedOnServer: boolean;
  isLoading: boolean;
  error: string | null;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const VISITOR_SUBSCRIBED_KEY = 'visitor_notification_subscribed';
const VISITOR_DISMISSED_KEY = 'visitor_notification_dismissed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isSubscribedOnServer: false,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const checkSupportAndSync = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      
      if (!isSupported) {
        setState(prev => ({ ...prev, isSupported: false }));
        return;
      }

      const permission = Notification.permission as PermissionState;
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        localStorage.removeItem(VISITOR_SUBSCRIBED_KEY);
        localStorage.removeItem(VISITOR_DISMISSED_KEY);
      }
      
      let isSubscribed = false;
      let isSubscribedOnServer = false;
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = subscription !== null;
        
        if (subscription && permission === 'granted' && token) {
          const subscriptionJson = subscription.toJSON();
          
          if (subscriptionJson.keys?.p256dh && subscriptionJson.keys?.auth) {
            try {
              const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  endpoint: subscription.endpoint,
                  p256dh: subscriptionJson.keys.p256dh,
                  auth: subscriptionJson.keys.auth,
                }),
              });
              
              if (response.ok) {
                isSubscribedOnServer = true;
                console.log('[Push] Subscription synced with server');
              } else {
                console.log('[Push] Server sync failed:', response.status);
              }
            } catch (syncError) {
              console.log('[Push] Error syncing subscription:', syncError);
            }
          }
        }
      } catch (error) {
        console.log('[Push] Error checking subscription:', error);
      }

      setState(prev => ({
        ...prev,
        isSupported: true,
        permission,
        isSubscribed: isSubscribedOnServer || (isSubscribed && !token),
        isSubscribedOnServer,
      }));
    };

    checkSupportAndSync();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission: permission as PermissionState }));
      
      if (permission !== 'granted') {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'Permission denied' 
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Error requesting permission' 
      }));
      return false;
    }
  }, [state.isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permissionGranted = state.permission === 'granted' || await requestPermission();
      if (!permissionGranted) {
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        if (!VAPID_PUBLIC_KEY) {
          console.log('[Push] VAPID public key not configured');
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            error: 'Push notifications not configured on server' 
          }));
          return false;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subscriptionJson = subscription.toJSON();
      
      await apiRequest('POST', '/api/notifications/subscribe', {
        endpoint: subscription.endpoint,
        p256dh: subscriptionJson.keys?.p256dh || '',
        auth: subscriptionJson.keys?.auth || '',
      });

      setState(prev => ({ 
        ...prev, 
        isSubscribed: true, 
        isSubscribedOnServer: true,
        isLoading: false,
        error: null 
      }));
      
      return true;
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Error subscribing to notifications' 
      }));
      return false;
    }
  }, [state.isSupported, state.permission, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !state.isSubscribed) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        await apiRequest('POST', '/api/notifications/unsubscribe', {
          endpoint: subscription.endpoint,
        });
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: false, 
        isSubscribedOnServer: false,
        isLoading: false,
        error: null 
      }));
      
      return true;
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Error unsubscribing from notifications' 
      }));
      return false;
    }
  }, [state.isSupported, state.isSubscribed]);

  const showLocalNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!state.isSupported || state.permission !== 'granted') {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/logo.png',
        badge: '/favicon.png',
        ...options,
      });
      return true;
    } catch (error) {
      console.error('[Push] Error showing notification:', error);
      return false;
    }
  }, [state.isSupported, state.permission]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
  };
}
