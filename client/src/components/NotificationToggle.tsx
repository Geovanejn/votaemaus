import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function NotificationToggle() {
  const { toast } = useToast();
  const {
    isSupported,
    permission,
    isSubscribed,
    isSubscribedOnServer,
    isLoading: hookLoading,
    subscribe,
    error: hookError,
  } = usePushNotifications();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hookError) {
      console.error('[NotificationToggle] Hook error:', hookError);
    }
  }, [hookError]);

  const handleActivate = async () => {
    if (!isSupported) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return;
    }

    if (permission === "denied") {
      toast({
        title: "Permissão Negada",
        description: "As notificações foram bloqueadas nas configurações do seu navegador. Para ativar, clique no ícone de cadeado na barra de endereços (ao lado da URL) e altere a permissão de Notificações para 'Permitir'.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await subscribe();
      if (success) {
        toast({
          title: "Sucesso!",
          description: "Notificações ativadas com sucesso.",
        });
      } else {
        toast({
          title: "Erro",
          description: hookError || "Não foi possível ativar as notificações. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[NotificationToggle] Error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao ativar as notificações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isActive = isSubscribed && isSubscribedOnServer;
  const isProcessing = loading || hookLoading;

  if (isActive) {
    return (
      <Button variant="outline" size="sm" className="w-full gap-2 text-green-600 border-green-200 bg-green-50" disabled data-testid="button-notifications-active">
        <Bell className="h-4 w-4" />
        Notificações Ativas
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="w-full gap-2 hover-elevate" 
      onClick={handleActivate}
      disabled={isProcessing}
      data-testid="button-activate-notifications-toggle"
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {permission === 'granted' && !isSubscribedOnServer ? 'Reativar Notificações' : 'Ativar Notificações'}
    </Button>
  );
}
