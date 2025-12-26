import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft,
  Loader2,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Trophy,
  Heart,
  Brain,
  MessageSquare,
  Star,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstudeScreen } from "@/components/study/EstudeScreen";
import { MediteScreen } from "@/components/study/MediteScreen";
import { RespondaScreen } from "@/components/study/RespondaScreen";

interface EventLesson {
  id: number;
  eventId: number;
  dayNumber: number;
  title: string;
  content: string;
  verseReference: string | null;
  verseText: string | null;
  questions: Question[];
  xpReward: number | null;
  status: string | null;
}

interface Question {
  id: string;
  type?: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  statement?: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string | boolean;
  explanation?: string;
  isTrue?: boolean;
}

interface UserProgress {
  id: number;
  lessonId: number;
  completed: boolean;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
}

interface LessonResponse {
  lesson: EventLesson;
  progress: UserProgress | null;
}

type Stage = "estude" | "medite" | "responda";

interface StageCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  xpEarned: number;
  stageType: Stage;
  nextStage: Stage | null;
  correctAnswers?: number;
  totalQuestions?: number;
}

function StageCompleteModal({ 
  isOpen, 
  onClose, 
  xpEarned, 
  stageType, 
  nextStage,
  correctAnswers,
  totalQuestions 
}: StageCompleteModalProps) {
  const stageLabels: Record<Stage, string> = {
    estude: "Estude",
    medite: "Medite",
    responda: "Responda"
  };

  const stageIcons: Record<Stage, JSX.Element> = {
    estude: <BookOpen className="h-8 w-8" />,
    medite: <Heart className="h-8 w-8" />,
    responda: <Brain className="h-8 w-8" />
  };

  const isLessonComplete = stageType === "responda" && !nextStage;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center sr-only">
            {isLessonComplete ? "Lição Completa" : `${stageLabels[stageType]} Concluído`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isLessonComplete 
                ? "bg-amber-500/20 text-amber-500" 
                : "bg-primary/20 text-primary"
            }`}
          >
            {isLessonComplete ? (
              <Trophy className="h-10 w-10" />
            ) : (
              stageIcons[stageType]
            )}
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold mb-2"
          >
            {isLessonComplete ? "Lição Concluída!" : `${stageLabels[stageType]} Concluído!`}
          </motion.h2>

          {isLessonComplete && correctAnswers !== undefined && totalQuestions !== undefined && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mb-4"
            >
              Você acertou {correctAnswers} de {totalQuestions} questões
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Badge className="bg-amber-500/10 text-amber-600 text-lg px-4 py-2">
              <Star className="h-5 w-5 mr-2 fill-amber-500" />
              +{xpEarned} XP
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button onClick={onClose} className="w-full" size="lg" data-testid="button-stage-continue">
              {nextStage ? (
                <>
                  Continuar para {stageLabels[nextStage]}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              ) : (
                "Voltar ao Evento"
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function parseContentSections(content: string): { estude: string; medite: string } {
  const estudeMatch = content.match(/<h2[^>]*>\s*Estude\s*<\/h2>([\s\S]*?)(?=<h2|$)/i);
  const mediteMatch = content.match(/<h2[^>]*>\s*Medite\s*<\/h2>([\s\S]*?)(?=<h2|$)/i);
  
  const estudeContent = estudeMatch ? estudeMatch[1].trim() : content;
  const mediteContent = mediteMatch ? mediteMatch[1].trim() : "";
  
  return { estude: estudeContent, medite: mediteContent };
}

export default function EventLessonPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ eventId: string; dayNumber: string }>();
  const eventId = parseInt(params.eventId || "0");
  const dayNumber = parseInt(params.dayNumber || "0");
  const { toast } = useToast();

  const audioCorrect = useRef<HTMLAudioElement | null>(null);
  const audioIncorrect = useRef<HTMLAudioElement | null>(null);
  const audioComplete = useRef<HTMLAudioElement | null>(null);
  const audioModal = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioCorrect.current = new Audio("/sounds/correct.mp3");
    audioIncorrect.current = new Audio("/sounds/incorrect.mp3");
    audioComplete.current = new Audio("/sounds/complete.mp3");
    audioModal.current = new Audio("/sounds/modal.mp3");
  }, []);

  const playSound = (type: "correct" | "incorrect" | "complete" | "modal") => {
    const audio = {
      correct: audioCorrect.current,
      incorrect: audioIncorrect.current,
      complete: audioComplete.current,
      modal: audioModal.current
    }[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  const [currentStage, setCurrentStage] = useState<Stage>(() => {
    const saved = localStorage.getItem(`lesson_${eventId}_${dayNumber}_stage`);
    return (saved as Stage) || "estude";
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const saved = localStorage.getItem(`lesson_${eventId}_${dayNumber}_questionIndex`);
    return saved ? parseInt(saved) : 0;
  });

  const [estudeScreenIndex, setEstudeScreenIndex] = useState(() => {
    const saved = localStorage.getItem(`lesson_${eventId}_${dayNumber}_estudeIndex`);
    return saved ? parseInt(saved) : 0;
  });
  const [mediteScreenIndex, setMediteScreenIndex] = useState(() => {
    const saved = localStorage.getItem(`lesson_${eventId}_${dayNumber}_mediteIndex`);
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem(`lesson_${eventId}_${dayNumber}_stage`, currentStage);
  }, [currentStage, eventId, dayNumber]);

  useEffect(() => {
    localStorage.setItem(`lesson_${eventId}_${dayNumber}_questionIndex`, currentQuestionIndex.toString());
  }, [currentQuestionIndex, eventId, dayNumber]);

  useEffect(() => {
    localStorage.setItem(`lesson_${eventId}_${dayNumber}_estudeIndex`, estudeScreenIndex.toString());
  }, [estudeScreenIndex, eventId, dayNumber]);

  useEffect(() => {
    localStorage.setItem(`lesson_${eventId}_${dayNumber}_mediteIndex`, mediteScreenIndex.toString());
  }, [mediteScreenIndex, eventId, dayNumber]);

  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [accumulatedXp, setAccumulatedXp] = useState(0);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [stageCompleteData, setStageCompleteData] = useState<{
    xp: number;
    stageType: Stage;
    nextStage: Stage | null;
    correctAnswers?: number;
    totalQuestions?: number;
  } | null>(null);

  const { data, isLoading, error } = useQuery<LessonResponse>({
    queryKey: ["/api/study/events", eventId, "lessons", dayNumber],
    enabled: !!user && eventId > 0 && dayNumber > 0,
  });

  const submitMutation = useMutation({
    mutationFn: async (results: { correct: number; total: number; score: number; lessonId: number }) => {
      return apiRequest("POST", `/api/study/events/${eventId}/lessons/${results.lessonId}/complete`, {
        correctAnswers: results.correct,
        totalQuestions: results.total,
        score: results.score,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/events", eventId, "lessons", dayNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study/profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar progresso",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const lesson = data?.lesson;
  const progress = data?.progress;
  const isCompleted = progress?.completed || false;
  const lessonId = lesson?.id;

  const contentSections = useMemo(() => {
    if (!lesson?.content) return { estude: "", medite: "" };
    return parseContentSections(lesson.content);
  }, [lesson?.content]);

  // Convert questions to RespondaScreen format
  const convertedQuestions = useMemo(() => {
    return (lesson?.questions || []).map((q: any) => {
      const converted: any = {
        type: q.type || "multiple_choice",
        question: q.question || q.statement || "",
        explanation: q.explanation || ""
      };

      if (q.type === "multiple_choice" && q.options) {
        converted.options = q.options;
        converted.correctIndex = q.correctIndex ?? 0;
      } else if (q.type === "true_false") {
        converted.correctAnswer = q.isTrue !== undefined ? q.isTrue : (q.correctAnswer === true || q.correctAnswer === "true");
      } else if (q.type === "fill_blank") {
        converted.correctAnswer = q.correctAnswer || "";
      }

      return converted;
    });
  }, [lesson?.questions]);

  const questions = convertedQuestions;
  const baseXp = lesson?.xpReward || 50;
  const xpPerStage = Math.floor(baseXp / 3);

  const estudeSections = useMemo(() => {
    const estudeContent = contentSections.estude;
    const estudeParts = estudeContent.split(/<h3[^>]*>.*?<\/h3>/i).filter(Boolean);
    const titles = (estudeContent.match(/<h3[^>]*>(.*?)<\/h3>/gi) || []).map(t => t.replace(/<[^>]*>/g, ''));
    
    const sections: any[] = [];
    sections.push({ type: "topic", title: titles[0] || "Tópico 1", content: estudeParts[0] || "" });
    sections.push({ type: "topic", title: titles[1] || "Tópico 2", content: estudeParts[1] || "" });
    sections.push({ type: "conclusion", title: "Conclusão", content: estudeParts[2] || "Conclusão do estudo." });
    
    return sections;
  }, [contentSections.estude]);

  const mediteSections = useMemo(() => {
    const mediteContent = contentSections.medite;
    const mediteParts = mediteContent.split(/<hr\s*\/?>/i).filter(Boolean);
    
    const sections: any[] = [];
    sections.push({ type: "meditation", title: "Meditação", content: mediteParts[0] || mediteContent });
    sections.push({ type: "reflection", title: "Aplicação", content: mediteParts[1] || "Como você pode aplicar isso hoje?" });
    
    return sections;
  }, [contentSections.medite]);

  const handleEstudeComplete = () => {
    playSound("modal");
    const xp = xpPerStage;
    setAccumulatedXp(prev => prev + xp);
    setStageCompleteData({
      xp,
      stageType: "estude",
      nextStage: contentSections.medite ? "medite" : (questions.length > 0 ? "responda" : null)
    });
    setShowStageComplete(true);
  };

  const handleMediteComplete = () => {
    playSound("modal");
    const xp = xpPerStage;
    setAccumulatedXp(prev => prev + xp);
    setStageCompleteData({
      xp,
      stageType: "medite",
      nextStage: questions.length > 0 ? "responda" : null
    });
    setShowStageComplete(true);
  };

  const handleEstudeIndexChange = (index: number) => {
    setEstudeScreenIndex(index);
  };

  const handleMediteIndexChange = (index: number) => {
    setMediteScreenIndex(index);
  };

  const handleQuestionIndexChange = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleStageModalClose = () => {
    setShowStageComplete(false);
    if (stageCompleteData?.nextStage) {
      setCurrentStage(stageCompleteData.nextStage);
    } else {
      setLocation(`/study/events/${eventId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data || !lesson) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background border-b p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation(`/study/events/${eventId}`)}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-muted-foreground">Lição não encontrada</p>
        </div>
      </div>
    );
  }

  const stageLabels: Record<Stage, { label: string; icon: JSX.Element }> = {
    estude: { label: "Estude", icon: <BookOpen className="h-4 w-4" /> },
    medite: { label: "Medite", icon: <Heart className="h-4 w-4" /> },
    responda: { label: "Responda", icon: <Brain className="h-4 w-4" /> }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation(`/study/events/${eventId}`)}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <span className="text-xs text-muted-foreground">Dia {dayNumber}</span>
              <h1 className="text-lg font-semibold truncate">{lesson.title}</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 flex items-center justify-center">
          <Card className="max-w-md w-full text-center border-green-500/50 bg-green-500/5">
            <CardContent className="p-6">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Lição Concluída!</h2>
              {progress && (
                <p className="text-muted-foreground mb-4">
                  Você acertou {progress.correctAnswers}/{progress.totalQuestions} questões
                </p>
              )}
              <Button 
                onClick={() => setLocation(`/study/events/${eventId}`)}
                data-testid="button-back-to-event"
              >
                Voltar ao Evento
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation(`/study/events/${eventId}`)}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <span className="text-xs text-muted-foreground">Dia {dayNumber}</span>
            <h1 className="text-lg font-semibold truncate">{lesson.title}</h1>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {stageLabels[currentStage].icon}
            {stageLabels[currentStage].label}
          </Badge>
        </div>
        <div className="px-4 pb-3">
          <div className="flex gap-1 mb-2">
            {(["estude", "medite", "responda"] as Stage[]).map((stage) => (
              <div 
                key={stage}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  (stage === "estude" && currentStage !== "estude") ||
                  (stage === "medite" && currentStage === "responda")
                    ? "bg-primary"
                    : stage === currentStage
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {currentStage === "estude" && (
            <motion.div
              key="estude"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <EstudeScreen
                lessonTitle={lesson.title}
                sections={estudeSections}
                onComplete={handleEstudeComplete}
                onClose={() => setLocation(`/study/events/${eventId}`)}
                initialIndex={estudeScreenIndex}
                onIndexChange={handleEstudeIndexChange}
              />
            </motion.div>
          )}

          {currentStage === "medite" && (
            <motion.div
              key="medite"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <MediteScreen
                lessonTitle={lesson.title}
                sections={mediteSections}
                onComplete={handleMediteComplete}
                onClose={() => setLocation(`/study/events/${eventId}`)}
                initialIndex={mediteScreenIndex}
                onIndexChange={handleMediteIndexChange}
              />
            </motion.div>
          )}

          {currentStage === "responda" && (
            <motion.div
              key="responda"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <RespondaScreen
                lessonTitle={lesson.title}
                questions={questions}
                streak={0}
                initialQuestionIndex={currentQuestionIndex}
                onAnswer={(idx, ans, correct) => {
                  if (correct) {
                    setCorrectAnswers(prev => prev + 1);
                    playSound("correct");
                  } else {
                    playSound("incorrect");
                  }
                }}
                onComplete={(correct, total) => {
                   const score = Math.round((correct / total) * 100);
                   const xp = xpPerStage + Math.floor((correct / total) * xpPerStage);
                   
                   setAccumulatedXp(prev => prev + xp);
                   setStageCompleteData({
                     xp,
                     stageType: "responda",
                     nextStage: null,
                     correctAnswers: correct,
                     totalQuestions: total
                   });
                   setShowStageComplete(true);
                   playSound("complete");

                   if (lessonId && !isCompleted) {
                     submitMutation.mutate({ 
                       correct, 
                       total, 
                       score, 
                       lessonId 
                     });
                   }
                }}
                onClose={() => setLocation(`/study/events/${eventId}`)}
                onQuestionChange={handleQuestionIndexChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <StageCompleteModal
        isOpen={showStageComplete}
        onClose={handleStageModalClose}
        xpEarned={stageCompleteData?.xp || 0}
        stageType={stageCompleteData?.stageType || "estude"}
        nextStage={stageCompleteData?.nextStage || null}
        correctAnswers={stageCompleteData?.correctAnswers}
        totalQuestions={stageCompleteData?.totalQuestions}
      />
    </div>
  );
}
