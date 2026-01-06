import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NotificationToggle() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission === "denied") {
      toast({
        title: "Permissão Negada",
        description: "As notificações foram bloqueadas nas configurações do seu navegador. Para ativar, clique no ícone de cadeado na barra de endereços (ao lado da URL) e altere a permissão de Notificações para 'Permitir'.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast({
          title: "Sucesso!",
          description: "Notificações ativadas com sucesso.",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    } finally {
      setLoading(false);
    }
  };

  if (permission === "granted") {
    return (
      <Button variant="outline" size="sm" className="w-full gap-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700" disabled>
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
      onClick={requestPermission}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      Ativar Notificações
    </Button>
  );
}
