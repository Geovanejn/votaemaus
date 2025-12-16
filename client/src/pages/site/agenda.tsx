import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { 
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  Loader2,
  X,
  ExternalLink
} from "lucide-react";
import { SiGooglecalendar } from "react-icons/si";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/AnimatedPage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationLink } from "@/components/ui/location-link";

import eventImg1 from "@assets/Eleição_2025_2026_Stories (23)_1762028290367.png";
import eventImg2 from "@assets/Eleição_2025_2026_Stories (3)_1761781308477.png";
import eventImg3 from "@assets/Layout stories_1761779211233.png";
import eventImg4 from "@assets/Layout stories_1761779185102.png";
import eventImg5 from "@assets/image_1762037221993.png";
import defaultEventImg from "@assets/stock_images/christian_youth_conc_2afcb390.jpg";

const fallbackImages = [eventImg1, eventImg2, eventImg3, eventImg4, eventImg5];

interface EventData {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate?: string;
  time?: string;
  location?: string;
  locationUrl?: string;
  isPublished?: boolean;
  organizer?: string;
  category?: string;
}

const categoryColors: Record<string, string> = {
  "Culto": "bg-blue-500",
  "Retiro": "bg-green-500",
  "Confraternizacao": "bg-pink-500",
  "Ensaio": "bg-purple-500",
  "Estudo": "bg-amber-500",
};

function getCategory(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('culto')) return 'Culto';
  if (lowerTitle.includes('retiro')) return 'Retiro';
  if (lowerTitle.includes('natal') || lowerTitle.includes('confrat')) return 'Confraternizacao';
  if (lowerTitle.includes('ensaio')) return 'Ensaio';
  if (lowerTitle.includes('estudo')) return 'Estudo';
  return 'Culto';
}

function SimpleCalendar({ 
  selectedDate, 
  onSelectDate, 
  eventDates 
}: { 
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  eventDates: string[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthNames = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth} data-testid="button-prev-month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button variant="outline" size="icon" onClick={nextMonth} data-testid="button-next-month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="p-2" />;
          }
          
          const isToday = day.toDateString() === today.toDateString();
          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
          const hasEvent = eventDates.includes(day.toDateString());
          
          return (
            <button
              key={day.toDateString()}
              onClick={() => onSelectDate(isSelected ? undefined : day)}
              className={`
                p-2 text-center text-sm rounded-md transition-colors
                ${isToday ? "bg-accent text-accent-foreground" : ""}
                ${isSelected ? "bg-primary text-primary-foreground" : ""}
                ${!isToday && !isSelected ? "hover:bg-muted" : ""}
                ${hasEvent && !isSelected ? "font-bold underline decoration-primary" : ""}
              `}
              data-testid={`calendar-day-${day.getDate()}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const params = useParams<{ id?: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const { data: eventsData, isLoading, isError } = useQuery<EventData[]>({
    queryKey: ['/api/site/events'],
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    if (params.id && eventsData && eventsData.length > 0) {
      const eventId = parseInt(params.id, 10);
      const event = eventsData.find(e => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [params.id, eventsData]);

  const processedEvents = (eventsData || []).map((event, index) => ({
    ...event,
    date: new Date(event.startDate + 'T00:00:00'),
    category: getCategory(event.title),
    organizer: 'UMP Emaus',
    image: event.imageUrl && !event.imageUrl.includes('placeholder') 
      ? event.imageUrl 
      : fallbackImages[index % fallbackImages.length],
  }));

  const eventDates = processedEvents.map(e => e.date.toDateString());

  const filteredEvents = selectedDate
    ? processedEvents.filter(
        (event) => event.date.toDateString() === selectedDate.toDateString()
      )
    : processedEvents;

  const sortedEvents = [...(viewMode === "list" ? processedEvents : filteredEvents)].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const formatDate = (date: Date) => {
    return {
      day: date.getDate().toString().padStart(2, "0"),
      month: date.toLocaleString("pt-BR", { month: "short" }).toUpperCase().replace(".", ""),
      weekday: date.toLocaleString("pt-BR", { weekday: "short" }).toUpperCase().replace(".", ""),
    };
  };

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-gray-900 text-white py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-transparent" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-amber-500/30 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-amber-500 mb-6 shadow-lg shadow-primary/30">
              <CalendarIcon className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Agenda
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Confira os próximos eventos e atividades da UMP Emaús
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold">Próximos Eventos</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/site/events/google-calendar-subscribe");
                    const data = await response.json();
                    if (data.url) {
                      window.open(data.url, "_blank");
                    }
                  } catch (error) {
                    console.error("Error getting Google Calendar URL:", error);
                    window.open("/api/site/events/calendar.ics", "_blank");
                  }
                }}
                data-testid="button-sync-google-calendar"
              >
                <SiGooglecalendar className="h-4 w-4 mr-1" />
                Sincronizar com Google Agenda
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4 mr-1" />
                Lista
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                data-testid="button-view-calendar"
              >
                <Grid className="h-4 w-4 mr-1" />
                Calendario
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : isError || processedEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum evento programado</h3>
              <p className="text-muted-foreground">
                Novos eventos serao adicionados em breve.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className={viewMode === "calendar" ? "lg:col-span-2" : "lg:col-span-3"}>
                {sortedEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
                    <p className="text-muted-foreground">
                      {viewMode === "calendar" && selectedDate
                        ? "Não há eventos nesta data"
                        : "Não há eventos programados"}
                    </p>
                  </div>
                ) : (
                  <StaggerContainer className="space-y-4">
                    {sortedEvents.map((event) => {
                      const dateInfo = formatDate(event.date);
                      return (
                        <StaggerItem key={event.id}>
                          <motion.div
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card 
                              className="overflow-hidden hover-elevate cursor-pointer"
                              onClick={() => setSelectedEvent(event)}
                              data-testid={`card-event-${event.id}`}
                            >
                              <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                  <div className="relative md:w-48 md:min-h-[200px] h-32 md:h-auto overflow-hidden">
                                    <div 
                                      className="absolute inset-0 bg-cover bg-center"
                                      style={{ backgroundImage: `url(${event.image})` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent" />
                                    <div className="absolute inset-0 flex items-center justify-center md:justify-start md:pl-4">
                                      <div className="text-center text-white">
                                        <span className="text-xs font-semibold text-primary block">
                                          {dateInfo.month}
                                        </span>
                                        <span className="text-4xl font-bold block">
                                          {dateInfo.day}
                                        </span>
                                        <span className="text-xs text-gray-300 block">
                                          {dateInfo.weekday}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span 
                                            className={`w-2 h-2 rounded-full ${categoryColors[event.category] || "bg-gray-500"}`} 
                                          />
                                          <span className="text-xs text-muted-foreground">
                                            {event.category}
                                          </span>
                                        </div>
                                        <h3 className="text-lg font-semibold" data-testid={`event-title-${event.id}`}>
                                          {event.title}
                                        </h3>
                                      </div>
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground mb-4">
                                      {event.description}
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                      {event.time && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-4 w-4 text-primary" />
                                          {event.time}
                                        </span>
                                      )}
                                      {event.location && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4 text-primary" />
                                          {event.location}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4 text-primary" />
                                        {event.organizer}
                                      </span>
                                    </div>
                                    <div className="mt-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            const response = await fetch(`/api/site/events/${event.id}/google-calendar-url`);
                                            const data = await response.json();
                                            if (data.url) {
                                              window.open(data.url, "_blank");
                                            }
                                          } catch (error) {
                                            console.error("Error getting Google Calendar URL:", error);
                                          }
                                        }}
                                        data-testid={`button-add-to-calendar-${event.id}`}
                                      >
                                        <SiGooglecalendar className="h-4 w-4 mr-1" />
                                        Adicionar ao Google Agenda
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerContainer>
                )}
              </div>

              {viewMode === "calendar" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:col-span-1"
                >
                  <Card className="sticky top-20">
                    <CardContent className="p-4">
                      <SimpleCalendar
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        eventDates={eventDates}
                      />
                      
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground">
                          * Datas sublinhadas possuem eventos
                        </p>
                        {selectedDate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => setSelectedDate(undefined)}
                            data-testid="button-clear-date"
                          >
                            Limpar selecao
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedEvent.imageUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={selectedEvent.imageUrl} 
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {selectedEvent.description && (
                  <p className="text-muted-foreground">{selectedEvent.description}</p>
                )}

                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span>
                      {new Date(selectedEvent.startDate).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  
                  {selectedEvent.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{selectedEvent.time}</span>
                    </div>
                  )}
                  
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{selectedEvent.location}</span>
                      {selectedEvent.locationUrl && (
                        <Button variant="ghost" size="sm" asChild className="ml-auto">
                          <a href={selectedEvent.locationUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver no Maps
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {selectedEvent.location && (
                  <div className="pt-2">
                    <LocationLink
                      name={selectedEvent.location}
                      url={selectedEvent.locationUrl}
                      variant="card"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/site/events/${selectedEvent.id}/google-calendar-url`);
                        const data = await response.json();
                        if (data.url) {
                          window.open(data.url, "_blank");
                        }
                      } catch (error) {
                        console.error("Error getting Google Calendar URL:", error);
                      }
                    }}
                    data-testid="modal-button-add-to-calendar"
                  >
                    <SiGooglecalendar className="h-4 w-4 mr-2" />
                    Adicionar ao Google Agenda
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
