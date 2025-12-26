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
  Calendar,
  ChevronRight,
  Lock,
  CheckCircle2,
  Timer
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isBefore, isAfter, differenceInDays } from "date-fns";
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

function getGradient(theme: string): string {
  const gradients: Record<string, string> = {
    reforma: "linear-gradient(135deg, #8B4513 0%, #D2691E 100%)",
    juventude: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
    pascoa: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
    natal: "linear-gradient(135deg, #DC2626 0%, #F97316 100%)",
    missoes: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    default: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
  };
  return gradients[theme.toLowerCase()] || gradients.default;
}

function EventCard({ event }: { event: StudyEvent }) {
  const [, setLocation] = useLocation();
  const monthLabel = getMonthLabel(event.startDate);
  const eventStatus = getEventStatus(event);
  const isLocked = eventStatus === "upcoming";
  const isEnded = eventStatus === "ended";
  const isActive = eventStatus === "active";
  
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  const daysUntilStart = differenceInDays(startDate, now);
  const daysUntilEnd = differenceInDays(endDate, now);

  const handleClick = () => {
    if (!isLocked && !isEnded) {
      setLocation(`/study/events/${event.id}`);
    }
  };

  const getThemeIcon = (theme: string) => {
    const t = theme.toLowerCase();
    if (t.includes('reforma')) return <Sparkles className="h-10 w-10 text-white/80" />;
    if (t.includes('jovem')) return <Sparkles className="h-10 w-10 text-white/80" />;
    if (t.includes('pascoa')) return <Sparkles className="h-10 w-10 text-white/80" />;
    if (t.includes('natal')) return <Sparkles className="h-10 w-10 text-white/80" />;
    if (t.includes('missoes')) return <Sparkles className="h-10 w-10 text-white/80" />;
    return <Sparkles className="h-10 w-10 text-white/80" />;
  };

  const getStatusBadge = () => {
    if (isActive) {
      return (
        <Badge className="bg-green-500 text-white border-green-600 px-3 py-1 rounded-full font-medium shrink-0">
          <Timer className="h-3 w-3 mr-1" />
          {daysUntilEnd === 0 ? "Ultimo dia!" : `${daysUntilEnd} ${daysUntilEnd === 1 ? "dia restante" : "dias restantes"}`}
        </Badge>
      );
    }
    if (isLocked) {
      return (
        <Badge className="bg-slate-400 text-white border-slate-500 px-3 py-1 rounded-full font-medium shrink-0">
          <Lock className="h-3 w-3 mr-1" />
          {daysUntilStart === 0 ? "Inicia hoje" : `Em ${daysUntilStart} ${daysUntilStart === 1 ? "dia" : "dias"}`}
        </Badge>
      );
    }
    if (isEnded) {
      return (
        <Badge className="bg-slate-300 text-slate-600 border-slate-400 px-3 py-1 rounded-full font-medium shrink-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Encerrado
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-50 text-amber-600 border-amber-100 px-3 py-1 rounded-full font-medium shrink-0">
        {monthLabel}
      </Badge>
    );
  };

  const getButtonContent = () => {
    if (isActive) {
      return "Participar";
    }
    if (isLocked) {
      return (
        <>
          <Lock className="h-4 w-4 mr-1" />
          Bloqueado
        </>
      );
    }
    return "Encerrado";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className={`cursor-pointer ${isLocked || isEnded ? "" : ""}`}
    >
      <Card 
        className={`overflow-hidden border-0 shadow-lg rounded-2xl bg-white dark:bg-card mb-4 ${isEnded ? "opacity-60" : ""} ${isLocked ? "opacity-80" : ""}`}
        data-testid={`card-event-${event.id}`}
      >
        <div 
          className="h-44 relative flex items-center justify-center overflow-hidden"
          style={{ 
            background: event.imageUrl 
              ? `url(${event.imageUrl}) center/cover` 
              : getGradient(event.theme)
          }}
        >
          {event.imageUrl && <div className="absolute inset-0 bg-black/20" />}
          {isLocked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
              <div className="text-center text-white">
                <Lock className="h-12 w-12 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-lg">Bloqueado</p>
                <p className="text-sm opacity-80">
                  {daysUntilStart === 0 ? "Inicia hoje" : `Inicia em ${daysUntilStart} ${daysUntilStart === 1 ? "dia" : "dias"}`}
                </p>
              </div>
            </div>
          )}
          <div className="relative z-10 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
             {getThemeIcon(event.theme)}
          </div>
        </div>
        
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-xl font-bold text-foreground leading-tight" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </h3>
            {getStatusBadge()}
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-4 leading-relaxed">
              {event.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground/70 font-medium">
              <Clock className="h-4 w-4" />
              <span>{event.durationLabel || `${event.lessonsCount || 5} dias de estudo`}</span>
            </div>

            <Button 
              className={`rounded-xl px-6 font-bold shadow-md h-10 ${
                isActive 
                  ? "bg-[#2D5A27] hover:bg-[#23471F] text-white" 
                  : isLocked 
                    ? "bg-slate-400 hover:bg-slate-500 text-white" 
                    : "bg-slate-300 text-slate-600"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              disabled={isLocked || isEnded}
              data-testid={`button-participate-${event.id}`}
            >
              {getButtonContent()}
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
      <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2D5A27]" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
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
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-background">
      <header className="sticky top-0 z-50 bg-white dark:bg-background border-b shadow-sm">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto w-full">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/study")}
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            data-testid="button-back"
          >
            <ArrowLeft className="h-6 w-6 text-slate-700 dark:text-slate-200" />
          </Button>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Eventos Especiais</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
            data-testid="button-search"
          >
            <Search className="h-6 w-6 text-slate-700 dark:text-slate-200" />
          </Button>
        </div>
      </header>

      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full">
        <div 
          className="relative py-12 px-8 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)'
          }}
        >
          {/* Subtle diagonal line pattern overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)' }} />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">?</span>
            </div>
          </motion.div>
          
          <motion.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-white mb-3 tracking-tight"
          >
            Estudos Especiais
          </motion.h2>
          
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-lg font-medium max-w-xs mx-auto leading-tight"
          >
            Explore nossos eventos temáticos e aprofunde sua jornada espiritual
          </motion.p>
        </div>

        <div className="p-5 space-y-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1 tracking-tight">Eventos em Destaque</h3>
            <p className="text-base text-slate-500 font-medium">
              Toque nos cards para explorar
            </p>
          </div>

          {featuredEvents.length === 0 && endedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <Sparkles className="h-16 w-16 text-slate-200 mb-6" />
              <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 mb-2">Nenhum evento no momento</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Fique atento! Novos eventos especiais serão anunciados em breve.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {featuredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}

              {endedEvents.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <div className="h-px bg-slate-200 flex-1" />
                    Eventos Anteriores
                    <div className="h-px bg-slate-200 flex-1" />
                  </h3>
                  <div className="space-y-6 opacity-80">
                    {endedEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-[#41793A] to-[#2D5A27] rounded-[2rem] overflow-hidden relative">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-10 -mb-10" />
              
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  Não perca nenhum evento
                </h3>
                <p className="text-white/80 text-base mb-8 font-medium leading-relaxed">
                  Ative as notificações para receber lembretes dos próximos estudos especiais
                </p>
                <Button 
                  className="bg-white text-[#2D5A27] hover:bg-slate-50 rounded-2xl px-10 h-14 font-black text-lg shadow-xl w-full sm:w-auto"
                  onClick={handleEnableNotifications}
                  disabled={pushLoading}
                  data-testid="button-enable-notifications"
                >
                  {pushLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Bell className="h-5 w-5 mr-2" />
                  )}
                  {isSubscribed ? "Notificações Ativas" : "Ativar Notificações"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}