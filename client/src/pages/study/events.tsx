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
  Timer,
  Gift,
  Heart,
  Users,
  Globe,
  BookOpen,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds };
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate]);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  return (
    <div className="flex items-center gap-1 font-mono text-sm">
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{pad(timeLeft.hours)}</span>
      <span>:</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{pad(timeLeft.minutes)}</span>
      <span>:</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{pad(timeLeft.seconds)}</span>
    </div>
  );
}

/**
 * Get date parts in Brazil timezone (America/Sao_Paulo)
 */
function getBrazilDateParts(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  return {
    year: parseInt(parts.find(p => p.type === 'year')?.value || '0'),
    month: parseInt(parts.find(p => p.type === 'month')?.value || '0'),
    day: parseInt(parts.find(p => p.type === 'day')?.value || '0'),
  };
}

/**
 * Calculate difference in calendar days using Brazil timezone
 * Returns positive if target is in the future, negative if in the past
 */
function differenceInCalendarDaysBrazil(targetDate: Date, baseDate: Date): number {
  const target = getBrazilDateParts(targetDate);
  const base = getBrazilDateParts(baseDate);
  
  // Create UTC dates at midnight for accurate day counting
  const targetMidnight = Date.UTC(target.year, target.month - 1, target.day);
  const baseMidnight = Date.UTC(base.year, base.month - 1, base.day);
  
  return Math.round((targetMidnight - baseMidnight) / (1000 * 60 * 60 * 24));
}

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
  // Check if manually ended by admin
  if (event.status === "ended") return "ended";

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
  
  // Use Brazil timezone-aware calendar day calculation
  const daysUntilStart = differenceInCalendarDaysBrazil(startDate, now);
  const daysUntilEnd = differenceInCalendarDaysBrazil(endDate, now);

  const handleClick = () => {
    if (!isLocked) {
      setLocation(`/study/events/${event.id}`);
    }
  };

  const getThemeIcon = (theme: string) => {
    const t = theme.toLowerCase();
    if (t.includes('natal')) return <Gift className="h-10 w-10 text-white/80" />;
    if (t.includes('pascoa')) return <Heart className="h-10 w-10 text-white/80" />;
    if (t.includes('juventude') || t.includes('jovem')) return <Users className="h-10 w-10 text-white/80" />;
    if (t.includes('missoes') || t.includes('missão')) return <Globe className="h-10 w-10 text-white/80" />;
    if (t.includes('reforma')) return <BookOpen className="h-10 w-10 text-white/80" />;
    return <Star className="h-10 w-10 text-white/80" />;
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
      return null;
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
          {isLocked ? (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center z-20">
              <Lock className="absolute top-4 right-4 h-7 w-7 text-white/80" />
              <div className="flex-1 flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                  {getThemeIcon(event.theme)}
                </div>
              </div>
              <div className="text-center text-white pb-4">
                {daysUntilStart <= 1 ? (
                  <div>
                    <p className="text-sm opacity-90 mb-1">Inicia em</p>
                    <CountdownTimer targetDate={startDate} />
                  </div>
                ) : (
                  <p className="text-sm opacity-80">
                    Inicia em {daysUntilStart} dias
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
              {getThemeIcon(event.theme)}
            </div>
          )}
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
              disabled={isLocked}
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

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-background">
      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full">
        <div 
          className="relative py-4 px-4 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)'
          }}
        >
          <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/study")}
              className="bg-white/20 hover:bg-white/30 text-white"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-white/20 hover:bg-white/30 text-white"
              data-testid="button-search"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)' }} />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-11 h-11 mx-auto mb-2 mt-6 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg"
          >
            <Sparkles className="h-5 w-5 text-white/80" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-bold text-white mb-1 tracking-tight"
          >
            Estudos Especiais
          </motion.h2>
          
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-xs font-medium max-w-xs mx-auto leading-tight"
          >
            Eventos temáticos para aprofundar sua jornada espiritual
          </motion.p>
        </div>

        <div className="p-4 space-y-6">

          {activeEvents.length === 0 && upcomingEvents.length === 0 && endedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <Star className="h-16 w-16 text-slate-200 mb-6" />
              <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 mb-2">Nenhum evento no momento</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Fique atento! Novos eventos especiais serão anunciados em breve.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Eventos em Andamento - no topo */}
              {activeEvents.length > 0 && (
                <>
                  <h3 className="text-sm font-bold text-green-600 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Timer className="h-4 w-4" />
                    Em Andamento
                    <div className="h-px bg-green-200 flex-1" />
                  </h3>
                  <div className="space-y-4">
                    {activeEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </>
              )}

              {/* Próximos Eventos - no meio */}
              {upcomingEvents.length > 0 && (
                <div className={activeEvents.length > 0 ? "pt-4" : ""}>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                    <Calendar className="h-4 w-4" />
                    Próximos Eventos
                    <div className="h-px bg-slate-200 flex-1" />
                  </h3>
                  <div className="space-y-4">
                    {upcomingEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}

              {/* Eventos Encerrados - no final */}
              {endedEvents.length > 0 && (
                <div className={activeEvents.length > 0 || upcomingEvents.length > 0 ? "pt-4" : ""}>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4" />
                    Eventos Anteriores
                    <div className="h-px bg-slate-200 flex-1" />
                  </h3>
                  <div className="space-y-4 opacity-80">
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
            <Card className="border-0 shadow-md bg-gradient-to-br from-[#41793A] to-[#2D5A27] rounded-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 w-14 h-14 bg-white/5 rounded-full -mr-4 -mt-4" />
              <div className="absolute bottom-0 left-0 w-10 h-10 bg-black/5 rounded-full -ml-4 -mb-4" />
              
              <CardContent className="p-3 text-center relative z-10">
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white mb-0.5 tracking-tight">
                  Fique por dentro
                </h3>
                <p className="text-white/80 text-xs mb-2 font-medium leading-snug">
                  Receba lembretes dos próximos estudos
                </p>
                <Button 
                  size="sm"
                  className="bg-white text-[#2D5A27] hover:bg-slate-50 rounded-lg px-3 h-7 font-semibold text-xs shadow"
                  onClick={handleEnableNotifications}
                  disabled={pushLoading}
                  data-testid="button-enable-notifications"
                >
                  {pushLoading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Bell className="h-3 w-3 mr-1" />
                  )}
                  {isSubscribed ? "Lembrete Ativo" : "Receber Lembrete"}
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