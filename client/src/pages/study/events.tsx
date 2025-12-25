import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Loader2,
  ArrowLeft,
  Sparkles,
  Clock,
  MapPin,
  Search,
  Heart,
  Star,
  Globe,
  Book,
  Phone,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  location?: string | null;
  time?: string | null;
}

const themeConfig: Record<string, { label: string; icon: typeof Sparkles; color: string }> = {
  historico: { label: "Evento Historico", icon: Book, color: "bg-amber-500" },
  juventude: { label: "Juventude", icon: Sparkles, color: "bg-teal-500" },
  celebracao: { label: "Celebracao", icon: Heart, color: "bg-rose-500" },
  natal: { label: "Natal", icon: Star, color: "bg-red-500" },
  missoes: { label: "Missoes", icon: Globe, color: "bg-blue-500" },
  default: { label: "Evento Especial", icon: Sparkles, color: "bg-primary" },
};

function getThemeConfig(theme: string) {
  return themeConfig[theme.toLowerCase()] || themeConfig.default;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startDay = format(start, "d", { locale: ptBR });
  const endDay = format(end, "d", { locale: ptBR });
  const month = format(start, "MMM", { locale: ptBR }).toUpperCase().replace(".", "");
  const year = format(start, "yyyy", { locale: ptBR });
  
  if (start.getMonth() === end.getMonth()) {
    return `${month} ${startDay}-${endDay}`;
  }
  return `${month} ${year}`;
}

function EventCard({ event }: { event: StudyEvent }) {
  const [, setLocation] = useLocation();
  const config = getThemeConfig(event.theme);
  const IconComponent = config.icon;
  const dateLabel = formatDateRange(event.startDate, event.endDate);

  const handleClick = () => {
    setLocation(`/study/events/${event.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="overflow-hidden border-0 shadow-lg"
        data-testid={`card-event-${event.id}`}
      >
        <div 
          className="relative h-56 bg-cover bg-center"
          style={{ 
            backgroundImage: event.imageUrl 
              ? `url(${event.imageUrl})` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-primary-foreground font-semibold text-xs px-2 py-1">
              {dateLabel}
            </Badge>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <div className={`w-5 h-5 rounded flex items-center justify-center ${config.color}`}>
                <IconComponent className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs text-white/90 font-medium">
                {config.label}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </h3>

            {event.description && (
              <p className="text-sm text-white/80 line-clamp-2 mb-3">
                {event.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-white/70">
                {event.time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{event.time}</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              <Button 
                variant="outline" 
                size="sm"
                className="bg-transparent border-white/50 text-white hover:bg-white/10"
                onClick={handleClick}
                data-testid={`button-view-event-${event.id}`}
              >
                Ver Detalhes
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: events, isLoading, error } = useQuery<StudyEvent[]>({
    queryKey: ["/api/study/events"],
    enabled: !!user,
  });

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
            Explore nossos eventos tematicos e aprofunde sua jornada espiritual
          </p>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Eventos em Destaque</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Toque nos cards para explorar
            </p>
          </div>

          {(!events || events.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-1">Nenhum evento no momento</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Fique atento! Novos eventos especiais serao anunciados em breve.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          <Card className="border-0 shadow-md mt-8">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Participe dos Estudos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Traga sua Biblia e um coracao aberto para aprender. Todos sao bem-vindos!
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                <Phone className="h-4 w-4" />
                <span>(11) 9999-9999</span>
              </div>
              <Button className="w-full" data-testid="button-receive-reminders">
                <Bell className="h-4 w-4 mr-2" />
                Receber Lembretes
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
