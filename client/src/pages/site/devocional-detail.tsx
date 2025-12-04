import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { 
  ArrowLeft,
  Calendar,
  User,
  Share2,
  BookOpen
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const mockDevotional = {
  id: 1,
  title: "A Força da Oração",
  verse: "Orai sem cessar.",
  verseReference: "1 Tessalonicenses 5:17",
  content: `
A oração é a nossa linha direta com Deus. Através dela, podemos expressar nossas alegrias, tristezas, pedidos e agradecimentos ao nosso Pai celestial.

Paulo, ao escrever aos tessalonicenses, nos exorta a orar sem cessar. Isso não significa que devemos passar o dia todo de joelhos, mas que devemos manter uma atitude de oração constante, uma comunhão contínua com Deus em todas as circunstâncias da vida.

**Por que devemos orar sem cessar?**

1. **A oração nos aproxima de Deus** - Quando oramos, entramos na presença do Altíssimo. É um privilégio que nos foi dado através do sacrifício de Cristo na cruz.

2. **A oração transforma nosso coração** - Ao orar, não apenas apresentamos nossos pedidos, mas também nos tornamos mais sensíveis à vontade de Deus para nossas vidas.

3. **A oração nos fortalece** - Nas batalhas espirituais, a oração é nossa arma mais poderosa. É através dela que recebemos força para enfrentar os desafios diários.

4. **A oração nos conecta com outros irmãos** - Quando oramos uns pelos outros, fortalecemos os laços da comunhão cristã.

**Aplicação Prática**

Hoje, separe momentos específicos para orar. Pode ser ao acordar, ao fazer as refeições, ao enfrentar desafios, e antes de dormir. Faça da oração um hábito constante em sua vida.

Que possamos, como jovens da UMP Emaús, ser conhecidos como um povo de oração, que busca a Deus em todo tempo e lugar.
  `,
  author: "Pastor João Silva",
  date: "04 de Dezembro, 2025",
  category: "Oração",
};

const relatedDevotionals = [
  {
    id: 2,
    title: "Fé que Move Montanhas",
    date: "03 de Dezembro, 2025",
    category: "Fé",
  },
  {
    id: 3,
    title: "O Amor Incondicional",
    date: "02 de Dezembro, 2025",
    category: "Amor",
  },
  {
    id: 4,
    title: "Confiando em Tempos Difíceis",
    date: "01 de Dezembro, 2025",
    category: "Confiança",
  },
];

export default function DevocionalDetailPage() {
  const { id } = useParams();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: mockDevotional.title,
          text: `${mockDevotional.verse} - ${mockDevotional.verseReference}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    }
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-primary via-orange-500 to-amber-500 text-white py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/devocionais">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10 gap-2 mb-6"
                data-testid="button-back-devotionals"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar aos Devocionais
              </Button>
            </Link>

            <div className="max-w-3xl">
              <div className="flex items-center gap-4 text-sm opacity-90 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {mockDevotional.date}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {mockDevotional.category}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-6" data-testid="devotional-detail-title">
                {mockDevotional.title}
              </h1>

              <blockquote className="border-l-4 border-white/50 pl-4 py-2">
                <p className="text-xl italic opacity-95">
                  "{mockDevotional.verse}"
                </p>
                <cite className="text-sm opacity-80 mt-2 block">
                  — {mockDevotional.verseReference}
                </cite>
              </blockquote>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardContent className="p-8">
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    {mockDevotional.content.split('\n\n').map((paragraph, index) => {
                      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                        return (
                          <h3 key={index} className="text-xl font-semibold mt-6 mb-3">
                            {paragraph.replace(/\*\*/g, '')}
                          </h3>
                        );
                      }
                      if (paragraph.match(/^\d\./)) {
                        return (
                          <p key={index} className="text-muted-foreground leading-relaxed mb-2">
                            {paragraph.split('**').map((part, i) => 
                              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                          </p>
                        );
                      }
                      return (
                        <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-4 mt-8 pt-6 border-t">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{mockDevotional.author}</p>
                        <p className="text-sm text-muted-foreground">{mockDevotional.date}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleShare}
                      className="gap-2"
                      data-testid="button-share-devotional"
                    >
                      <Share2 className="h-4 w-4" />
                      Compartilhar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Leia também
                  </h3>
                  <div className="space-y-4">
                    {relatedDevotionals.map((devotional) => (
                      <Link key={devotional.id} href={`/devocionais/${devotional.id}`}>
                        <div className="p-3 rounded-lg hover-elevate cursor-pointer">
                          <p className="text-xs text-muted-foreground mb-1">
                            {devotional.date}
                          </p>
                          <h4 className="font-medium text-sm">
                            {devotional.title}
                          </h4>
                          <span className="text-xs text-primary mt-1 inline-block">
                            {devotional.category}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
