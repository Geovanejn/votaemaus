import { useState, useCallback, useEffect, useRef } from 'react';

type PermissionState = 'default' | 'granted' | 'denied';

interface PushNotificationState {
  isSupported: boolean;
  permission: PermissionState;
  isSubscribed: boolean;
  isSubscribedOnServer: boolean;
  isLoading: boolean;
  error: string | null;
  browserInfo: { name: string; isBrave: boolean; requiresSetup: boolean } | null;
}

function detectBrowserInfo(): { name: string; isBrave: boolean; requiresSetup: boolean } {
  const ua = navigator.userAgent;
  const isBrave = !!(navigator as any).brave?.isBrave;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isFirefox = /Firefox/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  
  let name = 'navegador';
  if (isBrave) name = 'Brave';
  else if (isEdge) name = 'Edge';
  else if (isChrome) name = 'Chrome';
  else if (isFirefox) name = 'Firefox';
  else if (isSafari) name = 'Safari';
  
  const requiresSetup = isBrave || isIOS;
  
  return { name, isBrave, requiresSetup };
}

function getSubscriptionError(error: any, browserInfo: ReturnType<typeof detectBrowserInfo>): string {
  const errorStr = error?.message || error?.toString() || '';
  
  if (browserInfo.isBrave) {
    if (errorStr.includes('Registration failed') || 
        errorStr.includes('AbortError') ||
        errorStr.includes('InvalidStateError')) {
      return 'O Brave requer configuração: Acesse brave://settings/privacy e ative "Usar serviços do Google para mensagens push"';
    }
  }
  
  if (errorStr.includes('denied') || errorStr.includes('NotAllowedError')) {
    return 'Permissão negada. Habilite nas configurações do navegador.';
  }
  
  if (errorStr.includes('network') || errorStr.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet.';
  }
  
  return `Erro ao ativar notificações no ${browserInfo.name}. Verifique as permissões do navegador.`;
}

const VISITOR_SUBSCRIBED_KEY = 'visitor_notification_subscribed';
const VISITOR_DISMISSED_KEY = 'visitor_notification_dismissed';

let cachedVapidKey: string | null = null;

async function getVapidPublicKey(): Promise<string> {
  if (cachedVapidKey) return cachedVapidKey;
  
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey) {
    cachedVapidKey = envKey;
    return envKey;
  }
  
  try {
    const response = await fetch('/api/push/vapid-key');
    if (response.ok) {
      const data = await response.json();
      if (data.publicKey) {
        cachedVapidKey = data.publicKey;
        return data.publicKey;
      }
    }
  } catch (e) {
    console.error('[Push] Failed to fetch VAPID key from server:', e);
  }
  
  return '';
}

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

async function checkServerSubscriptionStatus(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/push/status', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      return data.hasSubscription === true;
    }
  } catch (e) {
    console.error('[Push] Failed to check server subscription status:', e);
  }
  return false;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isSubscribedOnServer: false,
    isLoading: false,
    error: null,
    browserInfo: null,
  });
  const syncInProgress = useRef(false);

  useEffect(() => {
    const checkSupportAndSync = async () => {
      if (syncInProgress.current) return;
      syncInProgress.current = true;
      
      try {
        const browserInfo = detectBrowserInfo();
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        
        if (!isSupported) {
          setState(prev => ({ ...prev, isSupported: false, browserInfo }));
          return;
        }

        const permission = Notification.permission as PermissionState;
        const token = localStorage.getItem('token');
        
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
          
          console.log('[Push] Browser subscription:', isSubscribed ? 'exists' : 'none');

          if (permission === 'granted' && token) {
            const serverHasSub = await checkServerSubscriptionStatus(token);
            console.log('[Push] Server subscription status:', serverHasSub);
            
            if (!serverHasSub) {
              console.log('[Push] Server missing subscription, attempting to register...');
              
              const vapidKey = await getVapidPublicKey();
              if (!vapidKey) {
                console.error('[Push] No VAPID key available');
                setState(prev => ({ ...prev, isSupported: true, permission, isSubscribed: false, isSubscribedOnServer: false, browserInfo }));
                return;
              }
              
              if (!subscription) {
                console.log('[Push] No browser subscription, creating new one...');
                try {
                  const newSub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey),
                  });
                  const subJson = newSub.toJSON();
                  if (subJson.keys?.p256dh && subJson.keys?.auth) {
                    const resp = await fetch('/api/notifications/subscribe', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        endpoint: newSub.endpoint,
                        p256dh: subJson.keys.p256dh,
                        auth: subJson.keys.auth,
                      }),
                    });
                    if (resp.ok) {
                      isSubscribedOnServer = true;
                      isSubscribed = true;
                      console.log('[Push] New subscription created and synced to server');
                    }
                  }
                } catch (subErr) {
                  console.error('[Push] Failed to create new subscription:', subErr);
                }
              } else {
                const subJson = subscription.toJSON();
                if (subJson.keys?.p256dh && subJson.keys?.auth) {
                  console.log('[Push] Syncing existing browser subscription to server...');
                  const resp = await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      endpoint: subscription.endpoint,
                      p256dh: subJson.keys.p256dh,
                      auth: subJson.keys.auth,
                    }),
                  });
                  if (resp.ok) {
                    isSubscribedOnServer = true;
                    console.log('[Push] Existing subscription synced to server');
                  }
                }
              }
            } else {
              isSubscribedOnServer = true;
            }
          }
        } catch (error) {
          console.error('[Push] Error during sync:', error);
        }

        setState(prev => ({
          ...prev,
          isSupported: true,
          permission,
          isSubscribed: isSubscribedOnServer || (isSubscribed && !token),
          isSubscribedOnServer,
          browserInfo,
        }));
      } finally {
        syncInProgress.current = false;
      }
    };

    checkSupportAndSync();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Push] Tab visible, revalidating subscription');
        checkSupportAndSync();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[Push] Service worker updated, re-syncing subscription');
        checkSupportAndSync();
      });
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
        console.error('[Push] Permission not granted for subscription');
        setState(prev => ({ ...prev, isLoading: false, error: 'Permission not granted' }));
        return false;
      }

      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        console.error('[Push] VAPID public key not available');
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'Push notifications not configured on server' 
        }));
        return false;
      }

      console.log('[Push] Requesting Service Worker ready...');
      const registration = await navigator.serviceWorker.ready;
      
      console.log('[Push] Checking existing subscription...');
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('[Push] Creating new subscription...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      console.log('[Push] Subscription obtained, sending to server...');
      const subscriptionJson = subscription.toJSON();
      const token = localStorage.getItem('token');
      
      if (token) {
        const anonSubId = localStorage.getItem('anonymous_push_subscription_id');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
        if (anonSubId) {
          headers['x-anonymous-subscription-id'] = anonSubId;
        }
        
        const response = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: subscriptionJson.keys?.p256dh || '',
            auth: subscriptionJson.keys?.auth || '',
          }),
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'Server subscription failed');
        }
        
        if (anonSubId) {
          localStorage.removeItem('anonymous_push_subscription_id');
        }
      } else {
        const response = await fetch('/api/notifications/subscribe-anonymous', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: subscriptionJson.keys?.p256dh || '',
            auth: subscriptionJson.keys?.auth || '',
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.id) {
            localStorage.setItem('anonymous_push_subscription_id', data.id.toString());
          }
        }
      }

      console.log('[Push] Server response received - subscription saved');
      localStorage.setItem('push_last_sync', Date.now().toString());
      
      setState(prev => ({ 
        ...prev, 
        isSubscribed: true, 
        isSubscribedOnServer: true,
        isLoading: false,
        error: null 
      }));
      
      return true;
    } catch (error: any) {
      console.error('[Push] Error subscribing:', error);
      const browserInfo = state.browserInfo || detectBrowserInfo();
      const errorMessage = getSubscriptionError(error, browserInfo);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: errorMessage 
      }));
      return false;
    }
  }, [state.isSupported, state.permission, state.browserInfo, requestPermission]);

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
        
        const token = localStorage.getItem('token');
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      localStorage.removeItem('push_last_sync');
      
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
