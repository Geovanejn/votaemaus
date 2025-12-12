import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { 
  BookOpen, 
  BookMarked, 
  Timer, 
  Zap, 
  User, 
  Target, 
  Brain, 
  Heart, 
  Lightbulb, 
  Flame,
  ChevronLeft,
  Check,
  Gift,
  Star,
  AlertCircle,
  Loader2,
  Clock,
  Send,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect, useCallback } from "react";
import { useSound } from "@/hooks/use-sound";

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  BookMarked,
  Timer,
  Zap,
  User,
  Target,
  Brain,
  Heart,
  Lightbulb,
  Flame,
};

interface MissionDetail {
  id: number;
  missionId: number;
  completed: boolean;
  mission: {
    id: number;
    type: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
  };
  content?: {
    dailyVerse?: string;
    verseReference?: string;
    bibleCharacter?: string;
    characterStory?: string;
    bibleFact?: string;
    themeToMemorize?: string;
    themeExplanation?: string;
    quizQuestions?: Array<{
      question: string;
      options: string[];
      correctIndex: number;
    }>;
  };
}

function VerseReaderActivity({ 
  content, 
  onComplete 
}: { 
  content: MissionDetail['content']; 
  onComplete: () => void;
}) {
  const [hasRead, setHasRead] = useState(false);

  return (
    <div className="space-y-6" data-testid="verse-reader-activity">
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <div className="text-center mb-4">
          <BookMarked className="w-12 h-12 mx-auto text-amber-600 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Versiculo do Dia</h3>
        </div>
        
        <blockquote className="text-lg italic text-center text-foreground/90 mb-4 leading-relaxed">
          "{content?.dailyVerse || 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna.'}"
        </blockquote>
        
        <p className="text-center font-semibold text-amber-700 dark:text-amber-400" data-testid="verse-reference">
          {content?.verseReference || 'Joao 3:16'}
        </p>
      </Card>

      <div className="space-y-4">
        <p className="text-center text-muted-foreground">
          Tire um momento para refletir sobre este versiculo e deixe a Palavra de Deus tocar seu coracao.
        </p>
        
        {!hasRead ? (
          <Button 
            onClick={() => setHasRead(true)} 
            className="w-full bg-amber-600 text-white"
            data-testid="button-mark-read"
          >
            Ja li e meditei
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button 
              onClick={onComplete} 
              className="w-full bg-[#58CC02] text-white"
              data-testid="button-complete-verse"
            >
              <Check className="w-4 h-4 mr-2" />
              Concluir Missao
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function QuizActivity({ 
  content, 
  missionType,
  onComplete 
}: { 
  content: MissionDetail['content']; 
  missionType: string;
  onComplete: () => void;
}) {
  const defaultQuestions = [
    { question: "Quantos livros tem a Biblia?", options: ["66", "72", "39", "27"], correctIndex: 0 },
    { question: "Quem escreveu Proverbios?", options: ["Moises", "Salomao", "Davi", "Paulo"], correctIndex: 1 },
    { question: "Quem foi lancado na cova dos leoes?", options: ["Jose", "Daniel", "Jonas", "Elias"], correctIndex: 1 },
  ];

  const questions = content?.quizQuestions || defaultQuestions;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(missionType === 'timed_challenge' ? 60 : null);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || quizComplete) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          setQuizComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quizComplete]);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    const isCorrect = index === questions[currentQuestion].correctIndex;
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setQuizComplete(true);
      }
    }, 1500);
  };

  const minCorrect = missionType === 'quick_quiz' ? 3 : 2;
  const canComplete = quizComplete && correctAnswers >= minCorrect;

  if (quizComplete) {
    return (
      <div className="space-y-6 text-center" data-testid="quiz-result">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
          canComplete ? 'bg-[#58CC02]' : 'bg-orange-500'
        }`}>
          {canComplete ? (
            <Star className="w-10 h-10 text-white" />
          ) : (
            <Target className="w-10 h-10 text-white" />
          )}
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {canComplete ? 'Parabens!' : 'Quase la!'}
          </h3>
          <p className="text-muted-foreground">
            Voce acertou {correctAnswers} de {questions.length} perguntas
          </p>
        </div>

        {canComplete ? (
          <Button 
            onClick={onComplete} 
            className="w-full bg-[#58CC02] text-white"
            data-testid="button-complete-quiz"
          >
            <Check className="w-4 h-4 mr-2" />
            Concluir Missao
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Voce precisa acertar pelo menos {minCorrect} perguntas para completar a missao.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="quiz-activity">
      {timeLeft !== null && (
        <div className="flex items-center justify-center gap-2 text-lg font-bold">
          <Clock className="w-5 h-5 text-orange-500" />
          <span className={timeLeft <= 10 ? 'text-red-500' : 'text-foreground'}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}

      <Progress 
        value={(currentQuestion / questions.length) * 100} 
        className="h-2"
      />
      
      <p className="text-sm text-muted-foreground text-center">
        Pergunta {currentQuestion + 1} de {questions.length}
      </p>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-center mb-6" data-testid="quiz-question">
          {questions[currentQuestion].question}
        </h3>

        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === questions[currentQuestion].correctIndex;
            
            let buttonClass = "w-full justify-start text-left p-4 min-h-[56px] h-auto whitespace-normal break-words";
            if (showResult) {
              if (isCorrect) {
                buttonClass += " bg-[#58CC02] text-white";
              } else if (isSelected && !isCorrect) {
                buttonClass += " bg-red-500 text-white";
              }
            }

            return (
              <Button
                key={index}
                variant={showResult ? "default" : "outline"}
                className={buttonClass}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                data-testid={`quiz-option-${index}`}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3 text-sm font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 break-words overflow-hidden">{option}</span>
              </Button>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-center gap-1">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index < currentQuestion 
                ? 'bg-[#58CC02]' 
                : index === currentQuestion 
                  ? 'bg-orange-500' 
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function BibleCharacterActivity({ 
  content, 
  onComplete 
}: { 
  content: MissionDetail['content']; 
  onComplete: () => void;
}) {
  const [hasRead, setHasRead] = useState(false);

  const character = content?.bibleCharacter || 'Daniel';
  const story = content?.characterStory || 
    'Daniel foi um jovem judeu levado cativo para a Babilonia. Ele se destacou por sua fe inabalavel em Deus, mesmo enfrentando a cova dos leoes. Sua historia nos ensina sobre fidelidade e coragem diante das adversidades.';

  return (
    <div className="space-y-6" data-testid="bible-character-activity">
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-foreground" data-testid="character-name">
            {character}
          </h3>
          <Badge variant="secondary" className="mt-2">Personagem Biblico do Dia</Badge>
        </div>
        
        <p className="text-foreground/90 leading-relaxed text-center" data-testid="character-story">
          {story}
        </p>
      </Card>

      {!hasRead ? (
        <Button 
          onClick={() => setHasRead(true)} 
          className="w-full bg-purple-600 text-white"
          data-testid="button-understood"
        >
          Entendi a historia
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button 
            onClick={onComplete} 
            className="w-full bg-[#58CC02] text-white"
            data-testid="button-complete-character"
          >
            <Check className="w-4 h-4 mr-2" />
            Concluir Missao
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function PrayerActivity({ 
  onComplete 
}: { 
  onComplete: (prayerText: string) => void;
}) {
  const [prayer, setPrayer] = useState('');
  const minLength = 10;

  return (
    <div className="space-y-6" data-testid="prayer-activity">
      <Card className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200 dark:border-rose-800">
        <div className="text-center mb-4">
          <Heart className="w-12 h-12 mx-auto text-rose-500 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Oracao de Gratidao</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Escreva uma oracao curta agradecendo a Deus por algo especial em sua vida.
          </p>
        </div>

        <Textarea
          placeholder="Obrigado, Deus, por..."
          value={prayer}
          onChange={(e) => setPrayer(e.target.value)}
          className="min-h-[120px] resize-none"
          data-testid="prayer-textarea"
        />
        
        <p className="text-xs text-muted-foreground text-right mt-2">
          {prayer.length} caracteres (minimo {minLength})
        </p>
      </Card>

      <Button 
        onClick={() => onComplete(prayer)} 
        disabled={prayer.length < minLength}
        className="w-full bg-[#58CC02] text-white"
        data-testid="button-submit-prayer"
      >
        <Send className="w-4 h-4 mr-2" />
        Enviar Oracao
      </Button>
    </div>
  );
}

function BibleFactActivity({ 
  content, 
  onComplete 
}: { 
  content: MissionDetail['content']; 
  onComplete: () => void;
}) {
  const [hasRead, setHasRead] = useState(false);

  const fact = content?.bibleFact || 
    'O livro de Ester e um dos dois livros da Biblia que nao menciona o nome de Deus diretamente (o outro e Cantares de Salomao). Mesmo assim, a providencia divina e claramente vista em toda a narrativa.';

  return (
    <div className="space-y-6" data-testid="bible-fact-activity">
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800">
        <div className="text-center mb-4">
          <Lightbulb className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Voce Sabia?</h3>
          <Badge variant="secondary" className="mt-2">Fato Biblico do Dia</Badge>
        </div>
        
        <p className="text-foreground/90 leading-relaxed text-center" data-testid="bible-fact">
          {fact}
        </p>
      </Card>

      {!hasRead ? (
        <Button 
          onClick={() => setHasRead(true)} 
          className="w-full bg-yellow-600 text-white"
          data-testid="button-understood-fact"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Interessante!
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button 
            onClick={onComplete} 
            className="w-full bg-[#58CC02] text-white"
            data-testid="button-complete-fact"
          >
            <Check className="w-4 h-4 mr-2" />
            Concluir Missao
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function MemorizeThemeActivity({ 
  content, 
  onComplete 
}: { 
  content: MissionDetail['content']; 
  onComplete: () => void;
}) {
  const [step, setStep] = useState<'read' | 'test' | 'done'>('read');
  const [userAnswer, setUserAnswer] = useState('');

  const theme = content?.themeToMemorize || 'Graca';
  const explanation = content?.themeExplanation || 
    'A Graca e o favor imerecido de Deus para conosco. Nao conseguimos merecer a salvacao por nossas obras, mas Deus nos oferece gratuitamente atraves de Jesus Cristo.';

  const handleTest = () => {
    if (userAnswer.toLowerCase().includes(theme.toLowerCase())) {
      setStep('done');
    }
  };

  return (
    <div className="space-y-6" data-testid="memorize-theme-activity">
      <Card className="p-6 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 border-cyan-200 dark:border-cyan-800">
        <div className="text-center mb-4">
          <Brain className="w-12 h-12 mx-auto text-cyan-600 mb-3" />
          <h3 className="text-lg font-bold text-foreground">Tema do Dia</h3>
        </div>
        
        {step === 'read' && (
          <>
            <div className="text-center mb-4">
              <span className="text-3xl font-black text-cyan-600" data-testid="theme-word">
                {theme}
              </span>
            </div>
            <p className="text-foreground/90 leading-relaxed text-center" data-testid="theme-explanation">
              {explanation}
            </p>
          </>
        )}

        {step === 'test' && (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Qual foi o tema que voce acabou de estudar?
            </p>
            <Textarea
              placeholder="Digite o tema..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="text-center"
              data-testid="theme-answer-input"
            />
          </div>
        )}

        {step === 'done' && (
          <div className="text-center">
            <Check className="w-16 h-16 mx-auto text-[#58CC02] mb-3" />
            <p className="text-[#58CC02] font-bold">Correto! Voce memorizou o tema.</p>
          </div>
        )}
      </Card>

      {step === 'read' && (
        <Button 
          onClick={() => setStep('test')} 
          className="w-full bg-cyan-600 text-white"
          data-testid="button-test-memory"
        >
          <Brain className="w-4 h-4 mr-2" />
          Testar Memoria
        </Button>
      )}

      {step === 'test' && (
        <Button 
          onClick={handleTest} 
          disabled={userAnswer.length < 2}
          className="w-full bg-cyan-600 text-white"
          data-testid="button-check-answer"
        >
          Verificar
        </Button>
      )}

      {step === 'done' && (
        <Button 
          onClick={onComplete} 
          className="w-full bg-[#58CC02] text-white"
          data-testid="button-complete-memorize"
        >
          <Check className="w-4 h-4 mr-2" />
          Concluir Missao
        </Button>
      )}
    </div>
  );
}

function LessonRedirectActivity({ 
  onComplete 
}: { 
  onComplete: () => void;
}) {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6 text-center" data-testid="lesson-redirect-activity">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <BookOpen className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">Conclua uma Licao</h3>
        <p className="text-muted-foreground">
          Para completar esta missao, voce precisa concluir uma licao na sua trilha de estudos.
        </p>
      </Card>

      <Button 
        onClick={() => setLocation('/study')} 
        className="w-full bg-blue-600 text-white"
        data-testid="button-go-to-lessons"
      >
        <ArrowRight className="w-4 h-4 mr-2" />
        Ir para as Licoes
      </Button>
    </div>
  );
}

function StreakActivity({ 
  onComplete 
}: { 
  onComplete: () => void;
}) {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading } = useQuery<{ currentStreak: number; lastLessonCompletedAt: string | null }>({
    queryKey: ["/api/study/profile"],
  });

  // User must have completed a lesson today to complete this mission
  const hasCompletedLessonToday = (() => {
    if (!profile?.lastLessonCompletedAt) return false;
    const lastLessonDate = new Date(profile.lastLessonCompletedAt);
    const today = new Date();
    return lastLessonDate.toDateString() === today.toDateString();
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFC800]" />
      </div>
    );
  }

  if (!hasCompletedLessonToday) {
    return (
      <div className="space-y-6 text-center" data-testid="streak-activity-incomplete">
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
          <Flame className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Complete uma Licao Hoje</h3>
          <p className="text-muted-foreground mb-4">
            Para completar esta missao, voce precisa concluir pelo menos uma licao hoje para garantir sua ofensiva do dia!
          </p>
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            Ofensiva atual: {profile?.currentStreak || 0} dias
          </Badge>
        </Card>

        <Button 
          onClick={() => setLocation('/study')} 
          className="w-full bg-orange-500 text-white"
          data-testid="button-go-study"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Ir Estudar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center" data-testid="streak-activity">
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Flame className="w-16 h-16 mx-auto text-orange-500 mb-4" />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground mb-2">Ofensiva Conquistada Hoje!</h3>
        <p className="text-muted-foreground mb-2">
          Parabens! Voce completou uma licao hoje e garantiu sua ofensiva!
        </p>
        <Badge className="bg-orange-500 text-white">
          {profile?.currentStreak || 0} dias de ofensiva
        </Badge>
      </Card>

      <Button 
        onClick={onComplete} 
        className="w-full bg-[#58CC02] text-white"
        data-testid="button-complete-streak"
      >
        <Check className="w-4 h-4 mr-2" />
        Concluir Missao
      </Button>
    </div>
  );
}

function PerfectAnswersActivity({ 
  onComplete 
}: { 
  onComplete: () => void;
}) {
  const { play } = useSound();
  const allQuestions = [
    { question: "Quem construiu a arca?", options: ["Abraao", "Noe", "Moises", "Davi"], correctIndex: 1 },
    { question: "Qual profeta enfrentou os profetas de Baal?", options: ["Elias", "Eliseu", "Isaias", "Jeremias"], correctIndex: 0 },
    { question: "Quantos discipulos Jesus escolheu?", options: ["10", "11", "12", "13"], correctIndex: 2 },
    { question: "Quem foi jogado na cova dos leoes?", options: ["Jonas", "Daniel", "Jose", "Elias"], correctIndex: 1 },
    { question: "Em que cidade Jesus nasceu?", options: ["Nazare", "Jerusalem", "Belem", "Cafarnaum"], correctIndex: 2 },
    { question: "Quem foi o primeiro rei de Israel?", options: ["Davi", "Salomao", "Saul", "Samuel"], correctIndex: 2 },
    { question: "Quem escreveu a maior parte dos Salmos?", options: ["Moises", "Salomao", "Davi", "Asafe"], correctIndex: 2 },
    { question: "Qual era a profissao de Pedro antes de seguir Jesus?", options: ["Carpinteiro", "Pescador", "Cobrador de impostos", "Pastor"], correctIndex: 1 },
    { question: "Quem foi engolido por um grande peixe?", options: ["Jonas", "Daniel", "Elias", "Jose"], correctIndex: 0 },
    { question: "Qual mulher foi escolhida rainha da Persia?", options: ["Rute", "Ester", "Raabe", "Debora"], correctIndex: 1 },
  ];

  // Shuffle and select 5 random questions
  const [questions] = useState(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleAnswer = (index: number) => {
    if (index === questions[currentQuestion].correctIndex) {
      play("correct");
      if (currentQuestion === questions.length - 1) {
        setPerfectStreak(5);
        play("complete");
      } else {
        setCurrentQuestion(prev => prev + 1);
        setPerfectStreak(prev => prev + 1);
      }
    } else {
      play("wrong");
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div className="space-y-6 text-center" data-testid="perfect-failed">
        <Card className="p-6">
          <Target className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Ops! Voce errou</h3>
          <p className="text-muted-foreground mb-4">
            Para completar esta missao, voce precisa acertar 5 perguntas seguidas sem errar.
          </p>
          <Button 
            onClick={() => {
              setCurrentQuestion(0);
              setPerfectStreak(0);
              setFailed(false);
            }}
            variant="outline"
            data-testid="button-try-again"
          >
            Tentar Novamente
          </Button>
        </Card>
      </div>
    );
  }

  if (perfectStreak >= 5) {
    return (
      <div className="space-y-6 text-center" data-testid="perfect-success">
        <Card className="p-6">
          <Star className="w-16 h-16 mx-auto text-[#58CC02] mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Perfeito!</h3>
          <p className="text-muted-foreground">
            Voce acertou {perfectStreak} perguntas seguidas!
          </p>
        </Card>

        <Button 
          onClick={onComplete} 
          className="w-full bg-[#58CC02] text-white"
          data-testid="button-complete-perfect"
        >
          <Check className="w-4 h-4 mr-2" />
          Concluir Missao
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="perfect-answers-activity">
      <div className="flex justify-center gap-2 mb-4">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              i < perfectStreak ? 'bg-[#58CC02]' : 'bg-muted'
            }`}
          >
            {i < perfectStreak && <Check className="w-4 h-4 text-white" />}
          </div>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-center mb-6" data-testid="perfect-question">
          {questions[currentQuestion].question}
        </h3>

        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start text-left p-4 min-h-[56px] h-auto whitespace-normal break-words"
              onClick={() => handleAnswer(index)}
              data-testid={`perfect-option-${index}`}
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3 text-sm font-bold">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1 break-words overflow-hidden">{option}</span>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function MissionActivityPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const [, setLocation] = useLocation();
  const [isCompleting, setIsCompleting] = useState(false);

  const { data: mission, isLoading, isError, refetch } = useQuery<MissionDetail>({
    queryKey: ["/api/missions", missionId, "detail"],
    queryFn: async () => {
      const response = await fetch(`/api/missions/${missionId}/detail`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch mission');
      return response.json();
    },
    enabled: !!missionId,
  });

  const completeMutation = useMutation({
    mutationFn: async (payload?: { prayerText?: string }) => {
      const response = await apiRequest("POST", `/api/missions/${missionId}/complete`, payload);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/missions/daily"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/study/profile"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/study/weekly-goal"] });
      setLocation('/study/missions');
    },
  });

  const handleComplete = useCallback((payload?: { prayerText?: string }) => {
    if (isCompleting || completeMutation.isPending) return;
    setIsCompleting(true);
    completeMutation.mutate(payload);
  }, [isCompleting, completeMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-state">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFC800]" />
          <span className="text-muted-foreground">Carregando missao...</span>
        </div>
      </div>
    );
  }

  if (isError || !mission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4" data-testid="error-state">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h3 className="font-bold text-lg text-foreground mb-2">
          Erro ao carregar missao
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Nao foi possivel carregar a missao. Tente novamente.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation('/study/missions')} data-testid="button-back-error">
            Voltar
          </Button>
          <Button onClick={() => refetch()} data-testid="button-retry">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (mission.completed) {
    return (
      <div className="min-h-screen bg-background p-4" data-testid="already-completed">
        <div className="max-w-lg mx-auto pt-12 text-center">
          <Check className="w-20 h-20 mx-auto text-[#58CC02] mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            Missao ja concluida!
          </h3>
          <p className="text-muted-foreground mb-6">
            Voce ja completou esta missao hoje.
          </p>
          <Button onClick={() => setLocation('/study/missions')} data-testid="button-back-completed">
            Voltar para Missoes
          </Button>
        </div>
      </div>
    );
  }

  if (!mission.mission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4" data-testid="error-state">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h3 className="font-bold text-lg text-foreground mb-2">
          Dados da missao incompletos
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Os detalhes da missao nao foram carregados corretamente.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation('/study/missions')} data-testid="button-back-error">
            Voltar
          </Button>
          <Button onClick={() => refetch()} data-testid="button-retry">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const IconComponent = iconMap[mission.mission.icon] || Star;
  const missionType = mission.mission.type;

  const renderActivity = () => {
    switch (missionType) {
      case 'read_daily_verse':
        return <VerseReaderActivity content={mission.content} onComplete={() => handleComplete()} />;
      
      case 'timed_challenge':
      case 'quick_quiz':
        return <QuizActivity content={mission.content} missionType={missionType} onComplete={() => handleComplete()} />;
      
      case 'bible_character':
        return <BibleCharacterActivity content={mission.content} onComplete={() => handleComplete()} />;
      
      case 'simple_prayer':
        return <PrayerActivity onComplete={(prayerText) => handleComplete({ prayerText })} />;
      
      case 'bible_fact':
        return <BibleFactActivity content={mission.content} onComplete={() => handleComplete()} />;
      
      case 'memorize_theme':
        return <MemorizeThemeActivity content={mission.content} onComplete={() => handleComplete()} />;
      
      case 'complete_lesson':
        return <LessonRedirectActivity onComplete={() => handleComplete()} />;
      
      case 'maintain_streak':
        return <StreakActivity onComplete={() => handleComplete()} />;
      
      case 'perfect_answers':
        return <PerfectAnswersActivity onComplete={() => handleComplete()} />;
      
      default:
        return (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tipo de missao nao suportado.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="mission-activity-page">
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/study/missions')}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-lg" data-testid="mission-title">{mission.mission.title}</h1>
            <p className="text-xs text-muted-foreground">
              {mission.mission.description}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="border-[#FFC800] text-[#FFC800]"
            data-testid="mission-xp-reward"
          >
            +{mission.mission.xpReward} XP
          </Badge>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <div className="flex justify-center mb-6">
          <div 
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFC800] to-[#FF9600] flex items-center justify-center"
            style={{ boxShadow: "0 4px 0 0 #E68A00" }}
          >
            <IconComponent className="w-8 h-8 text-white" />
          </div>
        </div>

        {renderActivity()}

        {completeMutation.isPending && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="completing-overlay">
            <div className="bg-card rounded-xl p-6 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#58CC02]" />
              <span className="text-foreground font-medium">Concluindo missao...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
