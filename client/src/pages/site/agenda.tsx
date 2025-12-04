import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  List,
  Grid
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/AnimatedPage";

const mockEvents = [
  {
    id: 1,
    title: "Culto Jovem",
    description: "Venha adorar a Deus conosco! Teremos louvor, pregação e comunhão.",
    date: new Date(2025, 11, 15),
    time: "19:30",
    location: "Igreja Sede",
    category: "Culto",
    organizer: "Secretaria de Espiritualidade",
  },
  {
    id: 2,
    title: "Retiro Anual UMP",
    description: "Três dias de imersão na Palavra, adoração e comunhão com os irmãos.",
    date: new Date(2025, 11, 20),
    time: "08:00",
    location: "Sítio Recanto da Paz",
    category: "Retiro",
    organizer: "Diretoria UMP",
  },
  {
    id: 3,
    title: "Natal da UMP",
    description: "Celebração especial de Natal com amigo secreto e confraternização.",
    date: new Date(2025, 11, 25),
    time: "20:00",
    location: "Igreja Sede",
    category: "Confraternização",
    organizer: "Secretaria Social",
  },
  {
    id: 4,
    title: "Ensaio do Louvor",
    description: "Preparação das músicas para o culto de virada de ano.",
    date: new Date(2025, 11, 28),
    time: "15:00",
    location: "Sala de Música",
    category: "Ensaio",
    organizer: "Ministério de Louvor",
  },
  {
    id: 5,
    title: "Culto de Virada de Ano",
    description: "Venha celebrar a entrada do novo ano em oração e gratidão.",
    date: new Date(2025, 11, 31),
    time: "22:00",
    location: "Igreja Sede",
    category: "Culto",
    organizer: "Secretaria de Espiritualidade",
  },
];

const categoryColors: Record<string, string> = {
  "Culto": "bg-blue-500",
  "Retiro": "bg-green-500",
  "Confraternização": "bg-pink-500",
  "Ensaio": "bg-purple-500",
  "Estudo": "bg-amber-500",
};

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
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const eventDates = mockEvents.map(e => e.date.toDateString());

  const filteredEvents = selectedDate
    ? mockEvents.filter(
        (event) => event.date.toDateString() === selectedDate.toDateString()
      )
    : mockEvents;

  const sortedEvents = [...(viewMode === "list" ? mockEvents : filteredEvents)].sort(
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
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
              <CalendarIcon className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Agenda</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Confira os próximos eventos e atividades da UMP Emaús
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold">Próximos Eventos</h2>
            <div className="flex items-center gap-2">
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
                Calendário
              </Button>
            </div>
          </div>

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
                          <Card className="overflow-hidden hover-elevate">
                            <CardContent className="p-0">
                              <div className="flex">
                                <div className="bg-primary text-primary-foreground p-4 flex flex-col items-center justify-center min-w-[90px]">
                                  <span className="text-xs font-medium opacity-90">
                                    {dateInfo.month}
                                  </span>
                                  <span className="text-3xl font-bold">
                                    {dateInfo.day}
                                  </span>
                                  <span className="text-xs opacity-90">
                                    {dateInfo.weekday}
                                  </span>
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
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {event.time}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {event.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      {event.organizer}
                                    </span>
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
                          Limpar seleção
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
