import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/study";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Compass, 
  BookOpen, 
  Heart, 
  Flame,
  Check,
  Loader2,
  Calendar,
  BookMarked,
  MessageSquare,
  Send,
  Volume2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { StudyProfile } from "@shared/schema";

interface DailyVerse {
  verse: string;
  reference: string;
}

interface DailyVerseStatusResponse {
  isRead: boolean;
  dateKey: string;
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [reflectionText, setReflectionText] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery<StudyProfile>({
    queryKey: ['/api/study/profile'],
    enabled: isAuthenticated,
  });

  const { data: dailyVerseData, isLoading: dailyVerseLoading } = useQuery<DailyVerse>({
    queryKey: ['/api/study/daily-verse'],
    enabled: isAuthenticated,
  });

  const { data: dailyVerseStatus } = useQuery<DailyVerseStatusResponse>({
    queryKey: ['/api/study/daily-verse/status'],
    enabled: isAuthenticated,
  });

  const { data: weeklyGoal } = useQuery<{ versesRead: number; versesGoal: number }>({
    queryKey: ['/api/study/weekly-goal'],
    enabled: isAuthenticated,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/study/daily-verse/confirm");
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['/api/study/daily-verse/status'] });
      await queryClient.cancelQueries({ queryKey: ['/api/study/weekly-goal'] });
      
      const previousStatus = queryClient.getQueryData<DailyVerseStatusResponse>(['/api/study/daily-verse/status']);
      const previousWeeklyGoal = queryClient.getQueryData<{ versesRead: number; versesGoal: number }>(['/api/study/weekly-goal']);
      
      queryClient.setQueryData<DailyVerseStatusResponse>(['/api/study/daily-verse/status'], (old) => ({
        isRead: true,
        dateKey: old?.dateKey || new Date().toISOString().split('T')[0]
      }));
      
      if (previousWeeklyGoal) {
        queryClient.setQueryData<{ versesRead: number; versesGoal: number }>(['/api/study/weekly-goal'], {
          ...previousWeeklyGoal,
          versesRead: previousWeeklyGoal.versesRead + 1
        });
      }
      
      return { previousStatus, previousWeeklyGoal };
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.setQueryData<DailyVerseStatusResponse>(['/api/study/daily-verse/status'], (old) => ({
          isRead: true,
          dateKey: old?.dateKey || new Date().toISOString().split('T')[0]
        }));
      }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(['/api/study/daily-verse/status'], context.previousStatus);
      }
      if (context?.previousWeeklyGoal) {
        queryClient.setQueryData(['/api/study/weekly-goal'], context.previousWeeklyGoal);
      }
    }
  });

  const dailyVerseRead = dailyVerseStatus?.isRead === true;
  const currentHearts = profile?.hearts ?? 5;
  const maxHearts = profile?.heartsMax ?? 5;
  const streak = profile?.streak ?? 0;
  const totalVersesRead = profile?.totalVersesRead ?? 0;
  const weeklyProgress = weeklyGoal?.versesRead ?? 0;
  const weeklyTarget = weeklyGoal?.versesGoal ?? 7;

  const handleMarkAsRead = () => {
    if (dailyVerseRead || markAsReadMutation.isPending) {
      return;
    }
    markAsReadMutation.mutate();
  };

  const handleSubmitReflection = () => {
    if (reflectionText.trim()) {
      setReflectionText("");
    }
  };

  if (profileLoading) {
    return <LoadingState />;
  }

  const dailyVerse: DailyVerse | null = dailyVerseData ? {
    verse: dailyVerseData.verse,
    reference: dailyVerseData.reference
  } : null;

  const reflection = "Como voce pode demonstrar o amor incondicional de Deus em suas acoes hoje?";

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="explore-page">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-center gap-2 p-4">
          <Compass className="h-6 w-6 text-primary" />
          <h1 className="font-black text-xl">Explorar</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card data-testid="daily-verse-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Versiculo do Dia</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Descubra a palavra de Deus para hoje</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {dailyVerseLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-muted-foreground">Carregando versiculo...</p>
                </div>
              ) : dailyVerse ? (
                <>
                  <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-md">
                    <p className="text-foreground italic leading-relaxed">
                      "{dailyVerse.verse}"
                    </p>
                  </blockquote>
                  <p className="font-semibold text-primary">{dailyVerse.reference}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "O amor de Deus e incondicional e eterno. Hoje, lembre-se de que voce e profundamente amado e que este amor transformador esta disponivel para todos."
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Versiculo indisponivel no momento</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card data-testid="mark-as-read-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Marcar como Lido</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Confirme sua leitura diaria</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {dailyVerseRead ? (
                <div className="w-full py-3 px-4 rounded-md bg-green-500/10 border border-green-500/30 flex items-center justify-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-green-500">Leitura concluida hoje</span>
                </div>
              ) : (
                <Button
                  onClick={handleMarkAsRead}
                  disabled={markAsReadMutation.isPending}
                  className="w-full"
                  data-testid="button-mark-verse-read"
                >
                  {markAsReadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Marcar
                    </span>
                  )}
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Marque como lido para manter sua sequencia diaria!
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card data-testid="hearts-recovery-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                <CardTitle className="text-lg">Recuperar Vidas</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Leia o versiculo em voz alta para ganhar uma vida extra</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vidas Atuais</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: maxHearts }).map((_, i) => (
                    <Heart
                      key={i}
                      className={cn(
                        "h-5 w-5 transition-colors",
                        i < currentHearts 
                          ? "fill-red-500 text-red-500" 
                          : "fill-muted text-muted-foreground"
                      )}
                    />
                  ))}
                  <span className="ml-2 text-sm font-bold">{currentHearts}/{maxHearts}</span>
                </div>
              </div>
              
              {currentHearts >= maxHearts ? (
                <p className="text-sm text-green-500 font-medium text-center">
                  Voce ja possui o maximo de vidas!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Voce pode recuperar {maxHearts - currentHearts} vida{maxHearts - currentHearts > 1 ? 's' : ''}
                </p>
              )}

              <Button
                onClick={() => setLocation("/study/verses")}
                variant={currentHearts >= maxHearts ? "secondary" : "default"}
                disabled={currentHearts >= maxHearts}
                className="w-full"
                data-testid="button-read-aloud"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Ler em Voz Alta
              </Button>
              
              {currentHearts >= maxHearts && (
                <p className="text-xs text-muted-foreground text-center">
                  Disponivel quando tiver menos de 5 vidas
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card data-testid="reading-stats-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Estatisticas de Leitura</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-md">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{streak}</p>
                  <p className="text-xs text-muted-foreground">Dias Consecutivos</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-md">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{totalVersesRead}</p>
                  <p className="text-xs text-muted-foreground">Versiculos Lidos</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Meta Semanal</span>
                  <span className="text-muted-foreground">{weeklyProgress}/{weeklyTarget} dias</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((weeklyProgress / weeklyTarget) * 100, 100)}%` }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                {weeklyProgress < weeklyTarget ? (
                  <p className="text-xs text-muted-foreground">
                    Continue assim! Faltam apenas {weeklyTarget - weeklyProgress} dias para completar a semana.
                  </p>
                ) : (
                  <p className="text-xs text-green-500 font-medium">
                    Parabens! Voce completou a meta semanal!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card data-testid="reflection-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Reflexao do Dia</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground font-medium">
                {reflection}
              </p>
              <div className="space-y-2">
                <Textarea
                  placeholder="Escreva sua reflexao aqui..."
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  className="min-h-[100px] resize-none"
                  data-testid="input-reflection"
                />
                <Button
                  onClick={handleSubmitReflection}
                  disabled={!reflectionText.trim()}
                  className="w-full"
                  data-testid="button-submit-reflection"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Responder Reflexao
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
