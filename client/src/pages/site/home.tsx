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
  Sparkles
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { HeroBanner } from "@/components/site/HeroBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/AnimatedPage";

import devocionalArt from "@assets/Fundo Layout stories_1761783891823.png";
import eventImg1 from "@assets/Eleição_2025_2026_Stories (23)_1762028290367.png";
import eventImg2 from "@assets/Eleição_2025_2026_Stories (3)_1761781308477.png";
import eventImg3 from "@assets/Layout stories_1761779211233.png";
import instagramImg1 from "@assets/Layout feed_1761779185103.png";
import instagramImg2 from "@assets/Layout stories_1761779185102.png";
import instagramImg3 from "@assets/Fundo Layout stories_1761780030672.png";
import instagramImg4 from "@assets/Sem Fundo Layout stories_1761780037463.png";
import instagramImg5 from "@assets/fundo_1761781968067.png";
import instagramImg6 from "@assets/Layout stories_1761780888593.png";

const mockDevotional = {
  id: 1,
  title: "A Força da Oração",
  verse: "Orai sem cessar.",
  verseReference: "1 Tessalonicenses 5:17",
  summary: "A oração é a nossa linha direta com Deus. Através dela, podemos expressar nossas alegrias, tristezas, pedidos e agradecimentos ao nosso Pai celestial. Quando oramos com fé, abrimos espaço para que Deus opere em nossas vidas de maneiras extraordinárias.",
  author: "Secretaria de Espiritualidade",
  date: "04 de Dezembro, 2025",
  image: devocionalArt,
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
    image: eventImg1,
  },
  {
    id: 2,
    title: "Retiro Anual UMP",
    date: "20",
    month: "DEZ",
    weekday: "SEX",
    time: "08:00",
    location: "Sítio Recanto",
    image: eventImg2,
  },
  {
    id: 3,
    title: "Natal da UMP",
    date: "25",
    month: "DEZ",
    weekday: "QUA",
    time: "20:00",
    location: "Igreja Sede",
    image: eventImg3,
  },
];

const instagramPosts = [
  instagramImg1,
  instagramImg2,
  instagramImg3,
  instagramImg4,
  instagramImg5,
  instagramImg6,
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
              <CardContent className="p-0">
                <div className="grid md:grid-cols-3">
                  <div className="relative overflow-hidden min-h-[280px]">
                    {mockDevotional.image && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${mockDevotional.image})` }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/70" />
                    <div className="relative p-8 flex flex-col justify-center h-full">
                      <div className="absolute top-4 right-4">
                        <Sparkles className="h-6 w-6 text-primary/50" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-sm text-primary mb-2">{mockDevotional.date}</p>
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2" data-testid="devotional-title">
                          {mockDevotional.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Por: {mockDevotional.author}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2 p-6 md:p-8 space-y-4">
                    <blockquote className="border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r-lg">
                      <p className="italic text-foreground/90">
                        "{mockDevotional.verse}"
                      </p>
                      <cite className="text-sm text-muted-foreground mt-1 block">
                        - {mockDevotional.verseReference}
                      </cite>
                    </blockquote>
                    <p className="text-muted-foreground leading-relaxed">
                      {mockDevotional.summary}
                    </p>
                    <Link href={`/devocionais/${mockDevotional.id}`}>
                      <Button className="gap-2" data-testid="button-read-devotional">
                        Ler Completo <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 overflow-x-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-2 mb-8 flex-wrap">
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

          <StaggerContainer className="flex flex-col md:grid md:grid-cols-3 gap-4">
            {mockEvents.map((event) => (
              <StaggerItem key={event.id}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="w-full overflow-hidden hover-elevate">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="relative min-w-[100px] min-h-[140px] overflow-hidden">
                          {event.image && (
                            <div 
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${event.image})` }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/80 to-gray-900/60" />
                          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-3">
                            <span className="text-xs font-semibold text-primary">
                              {event.month}
                            </span>
                            <span className="text-3xl font-bold">
                              {event.date}
                            </span>
                            <span className="text-xs text-gray-300">
                              {event.weekday}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-2 truncate" data-testid={`event-title-${event.id}`}>
                            {event.title}
                          </h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" /> 
                              <span className="truncate">{event.location}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-primary flex-shrink-0" /> {event.time}
                            </p>
                          </div>
                          <Link href={`/agenda`}>
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

      <section className="py-16 bg-muted/30 overflow-x-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-2 mb-8 flex-wrap">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
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
            {instagramPosts.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer"
                data-testid={`instagram-post-${i + 1}`}
              >
                <img 
                  src={img} 
                  alt={`Post Instagram ${i + 1}`}
                  className="w-full h-full object-cover"
                />
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
