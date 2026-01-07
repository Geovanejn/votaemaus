import { useState, useEffect, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const NOTIFICATION_DISMISSED_KEY = 'unified_notification_dismissed';
const NOTIFICATION_SUBSCRIBED_KEY = 'unified_notification_subscribed';
const ANONYMOUS_SUB_ID_KEY = 'anonymous_push_subscription_id';

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

export function UnifiedNotificationPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user, token } = useAuth();

  useEffect(() => {
    const checkAndShowPrompt = async () => {
      console.log('[UnifiedNotification] Checking visibility...');
      
      const supported = 
        'serviceWorker' in navigator && 
        'PushManager' in window && 
        'Notification' in window &&
        VAPID_PUBLIC_KEY;
      
      setIsSupported(!!supported);
      
      if (!supported) {
        console.log('[UnifiedNotification] Push notifications not supported');
        return;
      }
      
      const permission = Notification.permission;
      console.log('[UnifiedNotification] Permission:', permission);
      
      if (permission === 'denied') {
        console.log('[UnifiedNotification] Permission denied, not showing prompt');
        return;
      }
      
      const isDismissed = localStorage.getItem(NOTIFICATION_DISMISSED_KEY) === 'true';
      const isSubscribed = localStorage.getItem(NOTIFICATION_SUBSCRIBED_KEY) === 'true';
      
      console.log('[UnifiedNotification] isDismissed:', isDismissed, 'isSubscribed:', isSubscribed);
      
      if (isDismissed || isSubscribed) {
        return;
      }
      
      console.log('[UnifiedNotification] Showing prompt immediately');
      setIsOpen(true);
    };

    const timer = setTimeout(checkAndShowPrompt, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!token) return;
    
    const syncAnonymousSubscription = async () => {
      const anonSubId = localStorage.getItem(ANONYMOUS_SUB_ID_KEY);
      
      if (!anonSubId) {
        console.log('[UnifiedNotification] Token changed but no anonymous subscription to sync');
        return;
      }
      
      console.log('[UnifiedNotification] Token detected, syncing anonymous subscription ID:', anonSubId);
      
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[UnifiedNotification] Push not supported, cannot sync');
        return;
      }
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          console.log('[UnifiedNotification] No push subscription found to sync');
          return;
        }
        
        const subscriptionJson = subscription.toJSON();
        
        console.log('[UnifiedNotification] Syncing anonymous subscription to user account...');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-anonymous-subscription-id': anonSubId,
        };
        
        const response = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: subscriptionJson.keys?.p256dh || '',
            auth: subscriptionJson.keys?.auth || '',
          })
        });
        
        if (response.ok) {
          localStorage.removeItem(ANONYMOUS_SUB_ID_KEY);
          console.log('[UnifiedNotification] Successfully synced anonymous subscription to user, ID removed from localStorage');
        } else {
          console.error('[UnifiedNotification] Failed to sync subscription, status:', response.status);
        }
      } catch (e) {
        console.error('[UnifiedNotification] Error syncing subscription on login:', e);
      }
    };
    
    syncAnonymousSubscription();
  }, [token]);

  const handleDismiss = useCallback(() => {
    console.log('[UnifiedNotification] User dismissed notification prompt');
    localStorage.setItem(NOTIFICATION_DISMISSED_KEY, 'true');
    setIsOpen(false);
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (!isSupported) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    console.log('[UnifiedNotification] User clicked subscribe, token present:', !!token);
    
    try {
      const permission = await Notification.requestPermission();
      console.log('[UnifiedNotification] Permission result:', permission);
      
      if (permission !== 'granted') {
        setErrorMessage('Permissao negada. Habilite nas configuracoes do navegador.');
        setTimeout(() => {
          handleDismiss();
        }, 2000);
        return;
      }
      
      const registration = await navigator.serviceWorker.ready;
      console.log('[UnifiedNotification] Service worker ready');
      
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('[UnifiedNotification] Creating new subscription...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        console.log('[UnifiedNotification] New subscription created');
      }
      
      const subscriptionJson = subscription.toJSON();
      const anonSubId = localStorage.getItem(ANONYMOUS_SUB_ID_KEY);
      
      if (token) {
        console.log('[UnifiedNotification] Subscribing as logged user, anonSubId:', anonSubId);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
        if (anonSubId) {
          headers['x-anonymous-subscription-id'] = anonSubId;
        }
        
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: subscriptionJson.keys?.p256dh || '',
            auth: subscriptionJson.keys?.auth || '',
          })
        });
        
        if (anonSubId) {
          localStorage.removeItem(ANONYMOUS_SUB_ID_KEY);
          console.log('[UnifiedNotification] Removed anonymous subscription ID after member subscription');
        }
      } else {
        console.log('[UnifiedNotification] Subscribing as anonymous visitor');
        const response = await apiRequest('POST', '/api/notifications/subscribe-anonymous', {
          endpoint: subscription.endpoint,
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || '',
        });
        
        const data = await response.json();
        console.log('[UnifiedNotification] Anonymous subscription response:', data);
        
        if (data.id) {
          localStorage.setItem(ANONYMOUS_SUB_ID_KEY, data.id.toString());
          console.log('[UnifiedNotification] Saved anonymous subscription ID:', data.id);
        }
      }
      
      localStorage.setItem(NOTIFICATION_SUBSCRIBED_KEY, 'true');
      console.log('[UnifiedNotification] Subscription complete');
      setIsOpen(false);
    } catch (error) {
      console.error('[UnifiedNotification] Error subscribing:', error);
      setErrorMessage('Erro ao ativar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, token, handleDismiss]);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-notification-prompt">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Ative as notificacoes</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Receba avisos sobre novos devocionais, eventos, estudos e muito mais diretamente no seu dispositivo.
          </DialogDescription>
        </DialogHeader>
        
        {errorMessage && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {errorMessage}
          </div>
        )}
        
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full"
            data-testid="button-activate-notifications"
          >
            {isLoading ? 'Ativando...' : 'Ativar notificacoes'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={isLoading}
            className="w-full"
            data-testid="button-dismiss-notifications"
          >
            Agora nao
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
