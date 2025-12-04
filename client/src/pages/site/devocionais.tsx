import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  BookOpen, 
  Search, 
  Calendar,
  User,
  ArrowRight,
  Filter
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StaggerContainer, StaggerItem } from "@/components/AnimatedPage";

const mockDevotionals = [
  {
    id: 1,
    title: "A Força da Oração",
    verse: "Orai sem cessar.",
    verseReference: "1 Tessalonicenses 5:17",
    summary: "A oração é a nossa linha direta com Deus. Através dela, podemos expressar nossas alegrias, tristezas, pedidos e agradecimentos.",
    author: "Pastor João Silva",
    date: "04 de Dezembro, 2025",
    category: "Oração",
    isFeatured: true,
  },
  {
    id: 2,
    title: "Fé que Move Montanhas",
    verse: "Se tiverdes fé como um grão de mostarda, direis a este monte: Passa daqui para acolá, e ele há de passar.",
    verseReference: "Mateus 17:20",
    summary: "A fé não se mede por tamanho, mas pela sua genuinidade. Mesmo a menor fé verdadeira pode realizar grandes coisas em Deus.",
    author: "Maria Santos",
    date: "03 de Dezembro, 2025",
    category: "Fé",
    isFeatured: false,
  },
  {
    id: 3,
    title: "O Amor Incondicional",
    verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.",
    verseReference: "João 3:16",
    summary: "O amor de Deus não depende de nossas ações ou méritos. Ele nos amou primeiro, quando ainda éramos pecadores.",
    author: "Pastor Pedro Lima",
    date: "02 de Dezembro, 2025",
    category: "Amor",
    isFeatured: false,
  },
  {
    id: 4,
    title: "Confiando em Tempos Difíceis",
    verse: "Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum.",
    verseReference: "Salmos 23:4",
    summary: "Nos momentos mais sombrios de nossas vidas, podemos confiar que Deus está conosco e nunca nos abandonará.",
    author: "Ana Oliveira",
    date: "01 de Dezembro, 2025",
    category: "Confiança",
    isFeatured: false,
  },
  {
    id: 5,
    title: "Servindo ao Próximo",
    verse: "Aquele que quiser ser o maior entre vós, será vosso servo.",
    verseReference: "Mateus 20:26",
    summary: "Jesus nos ensinou que a verdadeira grandeza está em servir. O serviço ao próximo é a expressão prática do amor de Cristo.",
    author: "Lucas Ferreira",
    date: "30 de Novembro, 2025",
    category: "Serviço",
    isFeatured: false,
  },
  {
    id: 6,
    title: "A Paz que Excede Todo Entendimento",
    verse: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações.",
    verseReference: "Filipenses 4:7",
    summary: "A paz que Deus oferece vai além da compreensão humana. Ela guarda nosso coração em meio às tempestades da vida.",
    author: "Pastor João Silva",
    date: "29 de Novembro, 2025",
    category: "Paz",
    isFeatured: false,
  },
];

const categories = ["Todas", "Oração", "Fé", "Amor", "Confiança", "Serviço", "Paz"];

export default function DevocionaisPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const featuredDevotional = mockDevotionals.find(d => d.isFeatured);
  const otherDevotionals = mockDevotionals.filter(d => !d.isFeatured);

  const filteredDevotionals = otherDevotionals.filter(devotional => {
    const matchesSearch = devotional.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         devotional.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         devotional.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || devotional.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-primary via-orange-500 to-amber-500 text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
              <BookOpen className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Devocionais</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Fortaleça sua fé diariamente com reflexões baseadas na Palavra de Deus
            </p>
          </motion.div>
        </div>
      </section>

      {featuredDevotional && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <h2 className="text-lg font-semibold text-muted-foreground">Destaque do Dia</h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="overflow-hidden border-primary/20">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-3">
                    <div className="bg-gradient-to-br from-primary to-orange-600 text-white p-8 flex flex-col justify-center">
                      <p className="text-sm opacity-75 mb-2">{featuredDevotional.date}</p>
                      <h3 className="text-2xl font-bold mb-4" data-testid="featured-devotional-title">
                        {featuredDevotional.title}
                      </h3>
                      <blockquote className="border-l-2 border-white/50 pl-4 mb-4">
                        <p className="italic opacity-90">"{featuredDevotional.verse}"</p>
                        <cite className="text-sm opacity-75 block mt-1">
                          — {featuredDevotional.verseReference}
                        </cite>
                      </blockquote>
                    </div>
                    <div className="md:col-span-2 p-8">
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {featuredDevotional.summary}
                      </p>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{featuredDevotional.author}</span>
                        </div>
                        <Link href={`/devocionais/${featuredDevotional.id}`}>
                          <Button className="gap-2" data-testid="button-read-featured">
                            Ler Devocional Completo <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar devocionais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-devotionals"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-category">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredDevotionals.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum devocional encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar sua busca ou filtro
              </p>
            </div>
          ) : (
            <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDevotionals.map((devotional) => (
                <StaggerItem key={devotional.id}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link href={`/devocionais/${devotional.id}`}>
                      <Card className="h-full hover-elevate cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                            <Calendar className="h-3 w-3" />
                            <span>{devotional.date}</span>
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {devotional.category}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold mb-3" data-testid={`devotional-title-${devotional.id}`}>
                            {devotional.title}
                          </h3>
                          <blockquote className="border-l-2 border-primary/30 pl-3 mb-3">
                            <p className="text-sm italic text-muted-foreground line-clamp-2">
                              "{devotional.verse}"
                            </p>
                            <cite className="text-xs text-muted-foreground">
                              — {devotional.verseReference}
                            </cite>
                          </blockquote>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {devotional.summary}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{devotional.author}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
