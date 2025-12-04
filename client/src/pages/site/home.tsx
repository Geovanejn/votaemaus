import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Heart, 
  ArrowRight,
  BookMarked,
  Vote,
  GraduationCap,
  MapPin,
  Clock,
  Camera,
  Sparkles
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { HeroBanner } from "@/components/site/HeroBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/AnimatedPage";

const mockDevotional = {
  id: 1,
  title: "A Força da Oração",
  verse: "Orai sem cessar.",
  verseReference: "1 Tessalonicenses 5:17",
  summary: "A oração é a nossa linha direta com Deus. Através dela, podemos expressar nossas alegrias, tristezas, pedidos e agradecimentos ao nosso Pai celestial.",
  author: "Pastor João Silva",
  date: "04 de Dezembro, 2025",
};

const mockEvents = [
  {
    id: 1,
    title: "Culto Jovem",
    date: "15",
    month: "DEZ",
    weekday: "DOM",
    time: "19:30",
    location: "Igreja Sede",
  },
  {
    id: 2,
    title: "Retiro Anual UMP",
    date: "20",
    month: "DEZ",
    weekday: "SEX",
    time: "08:00",
    location: "Sítio Recanto",
  },
  {
    id: 3,
    title: "Natal da UMP",
    date: "25",
    month: "DEZ",
    weekday: "QUA",
    time: "20:00",
    location: "Igreja Sede",
  },
];

const quickAccessItems = [
  {
    icon: BookMarked,
    title: "Devocionais",
    description: "Leia a Palavra",
    href: "/devocionais",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: GraduationCap,
    title: "DeoGlory",
    description: "Sistema de Estudos",
    href: "/membro",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Vote,
    title: "Emaús Vota",
    description: "Sistema de Eleições",
    href: "/membro",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: Heart,
    title: "Oração",
    description: "Envie seu pedido",
    href: "/oracao",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

export default function HomePage() {
  return (
    <SiteLayout>
      <HeroBanner />

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Devocional do Dia</h2>
            </div>
            <Link href="/devocionais">
              <Button variant="ghost" className="gap-2" data-testid="link-all-devotionals">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {mockDevotional.date}
                    </p>
                    <h3 className="text-2xl font-bold" data-testid="devotional-title">
                      {mockDevotional.title}
                    </h3>
                    <blockquote className="border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r-lg">
                      <p className="italic text-foreground/90">
                        "{mockDevotional.verse}"
                      </p>
                      <cite className="text-sm text-muted-foreground mt-1 block">
                        — {mockDevotional.verseReference}
                      </cite>
                    </blockquote>
                    <p className="text-muted-foreground leading-relaxed">
                      {mockDevotional.summary}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Por: <span className="text-foreground">{mockDevotional.author}</span>
                    </p>
                    <Link href={`/devocionais/${mockDevotional.id}`}>
                      <Button className="gap-2" data-testid="button-read-devotional">
                        Ler Completo <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="hidden md:flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center"
                    >
                      <BookOpen className="h-12 w-12 text-primary" />
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Próximos Eventos</h2>
            </div>
            <Link href="/agenda">
              <Button variant="ghost" className="gap-2" data-testid="link-all-events">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <StaggerContainer className="flex gap-4 min-w-max md:min-w-0 md:grid md:grid-cols-3">
              {mockEvents.map((event) => (
                <StaggerItem key={event.id}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="w-[280px] md:w-auto overflow-hidden hover-elevate">
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="bg-gray-900 dark:bg-black text-white p-4 flex flex-col items-center justify-center min-w-[80px]">
                            <span className="text-xs font-medium text-primary">
                              {event.month}
                            </span>
                            <span className="text-3xl font-bold">
                              {event.date}
                            </span>
                            <span className="text-xs text-gray-400">
                              {event.weekday}
                            </span>
                          </div>
                          <div className="p-4 flex-1">
                            <h3 className="font-semibold text-lg mb-2" data-testid={`event-title-${event.id}`}>
                              {event.title}
                            </h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5" /> {event.location}
                              </p>
                              <p className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" /> {event.time}
                              </p>
                            </div>
                            <Link href={`/agenda/${event.id}`}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-3 gap-1 p-0 h-auto text-primary"
                                data-testid={`button-event-details-${event.id}`}
                              >
                                Saiba mais <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Acesso Rápido</h2>
            <p className="text-muted-foreground">
              Navegue pelos nossos recursos
            </p>
          </div>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickAccessItems.map((item) => (
              <StaggerItem key={item.href + item.title}>
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full hover-elevate cursor-pointer">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className={`w-14 h-14 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                          <item.icon className={`h-7 w-7 ${item.color}`} />
                        </div>
                        <h3 className="font-semibold mb-1" data-testid={`quick-access-${item.title.toLowerCase()}`}>
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Instagram</h2>
            </div>
            <a 
              href="https://instagram.com/umpemaus" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="ghost" className="gap-2" data-testid="link-follow-instagram">
                Seguir <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden cursor-pointer"
                data-testid={`instagram-post-${i}`}
              >
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Camera className="h-8 w-8 opacity-30" />
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-muted-foreground text-sm mt-4">
            @umpemaus
          </p>
        </div>
      </section>

      <section className="py-20 bg-gray-900 dark:bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">
              Precisa de oração?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Compartilhe seu pedido conosco. Nossa equipe de espiritualidade 
              estará orando por você.
            </p>
            <Link href="/oracao">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground font-semibold"
                data-testid="button-send-prayer"
              >
                <Heart className="h-5 w-5 mr-2" />
                Enviar Pedido de Oração
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </SiteLayout>
  );
}
