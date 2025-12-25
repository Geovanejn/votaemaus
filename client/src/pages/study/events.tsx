import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2,
  ArrowLeft,
  Sparkles,
  Clock,
  Search,
  Bell,
  Plus,
  Users,
  Church,
  Cross,
  Star,
  Globe
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";

interface StudyEvent {
  id: number;
  title: string;
  description: string | null;
  theme: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  cardId: number | null;
  lessonsCount: number | null;
  xpMultiplier: number | null;
  durationLabel?: string | null;
}

function getMonthLabel(startDate: string): string {
  const date = new Date(startDate);
  const month = format(date, "MMMM", { locale: ptBR });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

function getEventStatus(event: StudyEvent): "upcoming" | "active" | "ended" {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  
  if (isBefore(now, start)) return "upcoming";
  if (isAfter(now, end)) return "ended";
  return "active";
}

function getDefaultImage(theme: string): string {
  const images: Record<string, string> = {
    reforma: "linear-gradient(135deg, #8B4513 0%, #D2691E 100%)",
    juventude: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
    pascoa: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
    natal: "linear-gradient(135deg, #DC2626 0%, #F97316 100%)",
    missoes: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    default: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
  };
  return images[theme.toLowerCase()] || images.default;
}

function EventCard({ event }: { event: StudyEvent }) {
  const [, setLocation] = useLocation();
  const monthLabel = getMonthLabel(event.startDate);
  const eventStatus = getEventStatus(event);
  const isLocked = eventStatus === "ended";

  const handleClick = () => {
    if (!isLocked) {
      setLocation(`/study/events/${event.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={`overflow-hidden border shadow-sm ${isLocked ? "opacity-60" : ""}`}
        data-testid={`card-event-${event.id}`}
      >
        <div 
          className="h-40 bg-cover bg-center"
          style={{ 
            backgroundImage: event.imageUrl 
              ? `url(${event.imageUrl})` 
              : getDefaultImage(event.theme)
          }}
        />
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-bold text-foreground leading-tight" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </h3>
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 shrink-0">
              {monthLabel}
            </Badge>
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {event.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{event.durationLabel || `${event.lessonsCount || 5} dias de estudo`}</span>
            </div>

            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
              onClick={handleClick}
              disabled={isLocked}
              data-testid={`button-participate-${event.id}`}
            >
              {isLocked ? "Encerrado" : "Participar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isSupported, isSubscribed, subscribe, isLoading: pushLoading } = usePushNotifications();

  const { data: events, isLoading, error } = useQuery<StudyEvent[]>({
    queryKey: ["/api/study/events"],
    enabled: !!user,
  });

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return;
    }

    if (isSubscribed) {
      toast({
        title: "Notificações já ativadas",
        description: "Você já está recebendo notificações de eventos.",
      });
      return;
    }

    try {
      await subscribe();
      toast({
        title: "Notificações ativadas",
        description: "Você receberá lembretes sobre novos eventos.",
      });
    } catch (error) {
      toast({
        title: "Erro ao ativar notificações",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-muted-foreground">Erro ao carregar eventos</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const activeEvents = events?.filter(e => getEventStatus(e) === "active") || [];
  const upcomingEvents = events?.filter(e => getEventStatus(e) === "upcoming") || [];
  const endedEvents = events?.filter(e => getEventStatus(e) === "ended") || [];
  const featuredEvents = [...activeEvents, ...upcomingEvents];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/study")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Eventos Especiais</h1>
          <Button 
            variant="ghost" 
            size="icon"
            data-testid="button-search"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <div 
          className="relative py-10 px-6 text-center"
          style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)'
          }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white/80" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Estudos Especiais
          </h2>
          <p className="text-white/80 text-sm max-w-xs mx-auto">
            Explore nossos eventos temáticos e aprofunde sua jornada espiritual
          </p>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Eventos em Destaque</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Toque nos cards para explorar
            </p>
          </div>

          {featuredEvents.length === 0 && endedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-1">Nenhum evento no momento</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Fique atento! Novos eventos especiais serão anunciados em breve.
              </p>
            </div>
          ) : (
            <>
              {featuredEvents.length > 0 && (
                <div className="space-y-4">
                  {featuredEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}

              {endedEvents.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Eventos Anteriores
                  </h3>
                  <div className="space-y-4">
                    {endedEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <Card className="border-0 shadow-none bg-green-600 dark:bg-green-700 mt-8">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Não perca nenhum evento
              </h3>
              <p className="text-sm text-white/80 mb-4">
                Ative as notificações para receber lembretes dos próximos estudos especiais
              </p>
              <Button 
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/10"
                onClick={handleEnableNotifications}
                disabled={pushLoading}
                data-testid="button-enable-notifications"
              >
                {pushLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                {isSubscribed ? "Notificações Ativas" : "Ativar Notificações"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
