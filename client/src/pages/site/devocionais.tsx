import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  BookOpen, 
  Search, 
  Calendar,
  User,
  ArrowRight,
  Filter,
  Sparkles
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

import devocionalArt1 from "@assets/Fundo Layout stories_1761783891823.png";
import devocionalArt2 from "@assets/Layout stories_1761780888593.png";
import devocionalArt3 from "@assets/fundo_1761781968067.png";
import devocionalArt4 from "@assets/Sem Fundo Layout stories_1761780037463.png";
import devocionalArt5 from "@assets/Layout feed_1761779185103.png";
import devocionalArt6 from "@assets/Fundo Layout stories_1761780030672.png";

const mockDevotionals = [
  {
    id: 1,
    title: "A Força da Oração",
    verse: "Orai sem cessar.",
    verseReference: "1 Tessalonicenses 5:17",
    summary: "A oração é a nossa linha direta com Deus. Através dela, podemos expressar nossas alegrias, tristezas, pedidos e agradecimentos ao nosso Pai celestial. Quando oramos, abrimos nosso coração para Deus e permitimos que Ele trabalhe em nossas vidas.",
    author: "Secretaria de Espiritualidade",
    date: "04 de Dezembro, 2025",
    category: "Oração",
    isFeatured: true,
    image: devocionalArt1,
  },
  {
    id: 2,
    title: "Fé que Move Montanhas",
    verse: "Se tiverdes fé como um grão de mostarda, direis a este monte: Passa daqui para acolá, e ele há de passar.",
    verseReference: "Mateus 17:20",
    summary: "A fé não se mede por tamanho, mas pela sua genuinidade. Mesmo a menor fé verdadeira pode realizar grandes coisas quando depositada em Deus.",
    author: "Diretoria UMP",
    date: "03 de Dezembro, 2025",
    category: "Fé",
    isFeatured: false,
    image: devocionalArt2,
  },
  {
    id: 3,
    title: "O Amor Incondicional",
    verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.",
    verseReference: "João 3:16",
    summary: "O amor de Deus não depende de nossas ações ou méritos. Ele nos amou primeiro, quando ainda éramos pecadores. Esse amor transforma vidas.",
    author: "Secretaria de Espiritualidade",
    date: "02 de Dezembro, 2025",
    category: "Amor",
    isFeatured: false,
    image: devocionalArt3,
  },
  {
    id: 4,
    title: "Confiando em Tempos Difíceis",
    verse: "Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum.",
    verseReference: "Salmos 23:4",
    summary: "Nos momentos mais sombrios de nossas vidas, podemos confiar que Deus está conosco e nunca nos abandonará. Ele é o nosso pastor.",
    author: "Diretoria UMP",
    date: "01 de Dezembro, 2025",
    category: "Confiança",
    isFeatured: false,
    image: devocionalArt4,
  },
  {
    id: 5,
    title: "Servindo ao Próximo",
    verse: "Aquele que quiser ser o maior entre vós, será vosso servo.",
    verseReference: "Mateus 20:26",
    summary: "Jesus nos ensinou que a verdadeira grandeza está em servir. O serviço ao próximo é a expressão prática do amor de Cristo em nossas vidas.",
    author: "Secretaria Social",
    date: "30 de Novembro, 2025",
    category: "Serviço",
    isFeatured: false,
    image: devocionalArt5,
  },
  {
    id: 6,
    title: "A Paz que Excede Todo Entendimento",
    verse: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações.",
    verseReference: "Filipenses 4:7",
    summary: "A paz que Deus oferece vai além da compreensão humana. Ela guarda nosso coração em meio às tempestades da vida e nos dá serenidade.",
    author: "Secretaria de Espiritualidade",
    date: "29 de Novembro, 2025",
    category: "Paz",
    isFeatured: false,
    image: devocionalArt6,
  },
];

const categories = ["Todas", "Oração", "Fé", "Amor", "Confiança", "Serviço", "Paz"];

const categoryColors: Record<string, string> = {
  "Oração": "from-primary to-orange-600",
  "Fé": "from-blue-600 to-blue-800",
  "Amor": "from-rose-500 to-rose-700",
  "Confiança": "from-emerald-600 to-emerald-800",
  "Serviço": "from-violet-600 to-violet-800",
  "Paz": "from-cyan-600 to-cyan-800",
};

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
              <BookOpen className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Devocionais
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
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
                    <div className="relative overflow-hidden">
                      {featuredDevotional.image && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${featuredDevotional.image})` }}
                        />
                      )}
                      <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/70 text-white p-8 flex flex-col justify-center min-h-[300px]">
                        <div className="absolute top-4 right-4">
                          <Sparkles className="h-6 w-6 text-primary/60" />
                        </div>
                        <div className="relative z-10">
                          <p className="text-sm text-primary mb-2">{featuredDevotional.date}</p>
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold mb-4" data-testid="featured-devotional-title">
                            {featuredDevotional.title}
                          </h3>
                          <blockquote className="border-l-2 border-primary/50 pl-4 mb-4">
                            <p className="italic text-gray-300">"{featuredDevotional.verse}"</p>
                            <cite className="text-sm text-gray-400 block mt-1">
                              - {featuredDevotional.verseReference}
                            </cite>
                          </blockquote>
                        </div>
                      </div>
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
                      <Card className="h-full hover-elevate cursor-pointer overflow-hidden">
                        <CardContent className="p-0">
                          <div className="relative h-48 overflow-hidden">
                            {devotional.image && (
                              <div 
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${devotional.image})` }}
                              />
                            )}
                            <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[devotional.category] || "from-gray-700 to-gray-900"} opacity-80`} />
                            <div className="absolute inset-0 opacity-30">
                              <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
                            </div>
                            <div className="absolute top-2 right-2">
                              <Sparkles className="h-4 w-4 text-white/40" />
                            </div>
                            <div className="relative z-10 p-4 flex flex-col justify-end h-full">
                              <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
                                <Calendar className="h-3 w-3" />
                                <span>{devotional.date}</span>
                              </div>
                              <span className="inline-block bg-white/20 text-white px-2 py-0.5 rounded-full text-xs w-fit mb-2">
                                {devotional.category}
                              </span>
                              <h3 className="text-lg font-bold text-white" data-testid={`devotional-title-${devotional.id}`}>
                                {devotional.title}
                              </h3>
                            </div>
                          </div>
                          <div className="p-4">
                            <blockquote className="border-l-2 border-primary/30 pl-3 mb-3">
                              <p className="text-sm italic text-muted-foreground line-clamp-2">
                                "{devotional.verse}"
                              </p>
                              <cite className="text-xs text-muted-foreground">
                                - {devotional.verseReference}
                              </cite>
                            </blockquote>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {devotional.summary}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{devotional.author}</span>
                            </div>
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
