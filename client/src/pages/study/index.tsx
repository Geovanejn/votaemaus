import { useState } from "react";
import { useLocation } from "wouter";
import { 
  LessonMap, 
  HeartsDisplay, 
  XPDisplay, 
  StreakBadge, 
  LevelBadge,
  BottomNav 
} from "@/components/study";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Bell } from "lucide-react";

const mockUserProfile = {
  name: "João Silva",
  avatar: "",
  level: 5,
  totalXP: 450,
  xpForNextLevel: 800,
  streak: 7,
  hearts: 4,
  maxHearts: 5,
  heartsRefillMinutes: 180
};

const mockLessons = [
  { id: 1, title: "Introdução", type: "intro" as const, status: "completed" as const, xpReward: 10 },
  { id: 2, title: "O que é fé?", type: "study" as const, status: "completed" as const, xpReward: 15 },
  { id: 3, title: "Meditação", type: "meditation" as const, status: "available" as const, xpReward: 20 },
  { id: 4, title: "Exemplos de fé", type: "study" as const, status: "locked" as const, xpReward: 15 },
  { id: 5, title: "Desafio", type: "challenge" as const, status: "locked" as const, xpReward: 30, isBonus: true },
];

export default function StudyHomePage() {
  const [, setLocation] = useLocation();

  const handleLessonClick = (lessonId: number) => {
    const lesson = mockLessons.find(l => l.id === lessonId);
    if (lesson && lesson.status !== "locked") {
      setLocation(`/study/lesson/${lessonId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="study-home">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={mockUserProfile.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {mockUserProfile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-foreground" data-testid="text-user-name">
                {mockUserProfile.name}
              </p>
              <XPDisplay amount={mockUserProfile.totalXP} size="sm" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StreakBadge days={mockUserProfile.streak} size="sm" showLabel={false} />
            <HeartsDisplay 
              current={mockUserProfile.hearts} 
              max={mockUserProfile.maxHearts} 
              size="sm"
            />
            <Button variant="ghost" size="icon" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Meta diária</p>
              <p className="font-bold text-foreground">10 minutos</p>
            </div>
            <LevelBadge 
              level={mockUserProfile.level}
              currentXP={mockUserProfile.totalXP}
              xpForNextLevel={mockUserProfile.xpForNextLevel}
              size="md"
            />
          </div>
        </Card>

        <LessonMap
          weekTitle="A Fé que Transforma"
          weekNumber={48}
          lessons={mockLessons}
          onLessonClick={handleLessonClick}
        />
      </main>

      <BottomNav />
    </div>
  );
}
