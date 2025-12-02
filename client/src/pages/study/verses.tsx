import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerseList } from "@/components/study";
import { useToast } from "@/hooks/use-toast";

const mockVerses = [
  {
    id: 1,
    reference: "João 3:16",
    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    reflection: "Este versículo nos mostra a profundidade do amor de Deus. Ele não esperou que fôssemos dignos - Ele nos amou primeiro."
  },
  {
    id: 2,
    reference: "Salmos 23:1",
    text: "O Senhor é o meu pastor; nada me faltará.",
    reflection: "Quando reconhecemos Deus como nosso pastor, podemos descansar na certeza de que Ele cuida de todas as nossas necessidades."
  },
  {
    id: 3,
    reference: "Filipenses 4:13",
    text: "Tudo posso naquele que me fortalece.",
    reflection: "Nossa força não vem de nós mesmos, mas de Cristo. Com Ele, podemos enfrentar qualquer desafio."
  },
  {
    id: 4,
    reference: "Jeremias 29:11",
    text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.",
    reflection: "Deus tem planos específicos para cada um de nós. Mesmo em tempos difíceis, Ele está trabalhando para o nosso bem."
  },
  {
    id: 5,
    reference: "Romanos 8:28",
    text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.",
    reflection: "Não significa que tudo será fácil, mas que Deus usa todas as circunstâncias para nos moldar e abençoar."
  }
];

export default function VersesPage() {
  const [, setLocation] = useLocation();
  const [currentHearts, setCurrentHearts] = useState(3);
  const [completedVerses, setCompletedVerses] = useState<number[]>([]);
  const { toast } = useToast();
  const maxHearts = 5;

  const handleVerseComplete = (verseId: number) => {
    if (completedVerses.includes(verseId)) return;
    if (currentHearts >= maxHearts) return;

    setCompletedVerses(prev => [...prev, verseId]);
    setCurrentHearts(prev => Math.min(maxHearts, prev + 1));
    
    toast({
      title: "Vida recuperada!",
      description: "Você ganhou +1 vida pela leitura do versículo.",
    });
  };

  const availableVerses = mockVerses.filter(v => !completedVerses.includes(v.id));

  return (
    <div className="min-h-screen bg-background" data-testid="verses-page">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-3 p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/study")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">Versículos</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <VerseList
          verses={availableVerses}
          currentHearts={currentHearts}
          maxHearts={maxHearts}
          onVerseComplete={handleVerseComplete}
        />
      </main>
    </div>
  );
}
