import { useState } from "react";
import { useLocation } from "wouter";
import { BottomNav, HeartsDisplay } from "@/components/study";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Compass, 
  BookOpen, 
  Heart, 
  Sparkles, 
  Star, 
  Sun, 
  Shield, 
  Flame,
  ChevronRight,
  Lock,
  Check
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VerseCategory {
  id: string;
  name: string;
  icon: typeof Heart;
  color: string;
  shadowColor: string;
  versesCount: number;
  completedCount: number;
  isLocked: boolean;
}

interface DailyVerse {
  reference: string;
  text: string;
  isCompleted: boolean;
}

const mockCategories: VerseCategory[] = [
  { 
    id: "faith", 
    name: "Fe", 
    icon: Star, 
    color: "#FFC800", 
    shadowColor: "#CC9F00",
    versesCount: 12, 
    completedCount: 5,
    isLocked: false
  },
  { 
    id: "love", 
    name: "Amor", 
    icon: Heart, 
    color: "#FF4B4B", 
    shadowColor: "#CC3B3B",
    versesCount: 10, 
    completedCount: 3,
    isLocked: false
  },
  { 
    id: "hope", 
    name: "Esperanca", 
    icon: Sun, 
    color: "#58CC02", 
    shadowColor: "#46A302",
    versesCount: 8, 
    completedCount: 2,
    isLocked: false
  },
  { 
    id: "strength", 
    name: "Forca", 
    icon: Shield, 
    color: "#1CB0F6", 
    shadowColor: "#1899D6",
    versesCount: 15, 
    completedCount: 0,
    isLocked: false
  },
  { 
    id: "wisdom", 
    name: "Sabedoria", 
    icon: Sparkles, 
    color: "#A560E8", 
    shadowColor: "#8A4DC7",
    versesCount: 10, 
    completedCount: 0,
    isLocked: true
  },
  { 
    id: "peace", 
    name: "Paz", 
    icon: Flame, 
    color: "#FF9600", 
    shadowColor: "#CC7700",
    versesCount: 8, 
    completedCount: 0,
    isLocked: true
  },
];

const mockDailyVerse: DailyVerse = {
  reference: "Filipenses 4:13",
  text: "Tudo posso naquele que me fortalece.",
  isCompleted: false
};

function CategoryCard({ 
  category, 
  onClick,
  index 
}: { 
  category: VerseCategory; 
  onClick: () => void;
  index: number;
}) {
  const Icon = category.icon;
  const progress = category.versesCount > 0 
    ? (category.completedCount / category.versesCount) * 100 
    : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={!category.isLocked ? { scale: 1.02 } : undefined}
      whileTap={!category.isLocked ? { scale: 0.98 } : undefined}
      onClick={!category.isLocked ? onClick : undefined}
      disabled={category.isLocked}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all",
        "bg-card border-2 border-border",
        category.isLocked && "opacity-60 cursor-not-allowed"
      )}
      data-testid={`category-${category.id}`}
    >
      <div 
        className={cn(
          "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center",
          category.isLocked && "bg-muted"
        )}
        style={!category.isLocked ? { 
          backgroundColor: category.color,
          boxShadow: `0 4px 0 0 ${category.shadowColor}`
        } : {
          boxShadow: "0 4px 0 0 #CECECE"
        }}
      >
        {category.isLocked ? (
          <Lock className="h-6 w-6 text-muted-foreground/50" />
        ) : (
          <Icon className="h-6 w-6 text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-bold text-base",
            category.isLocked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {category.name}
          </h3>
          {category.completedCount === category.versesCount && category.versesCount > 0 && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#58CC02]">
              <Check className="h-3 w-3 text-white stroke-[3]" />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
              className="h-full rounded-full"
              style={{ backgroundColor: category.isLocked ? "#CECECE" : category.color }}
            />
          </div>
          <span className={cn(
            "text-xs font-bold",
            category.isLocked ? "text-muted-foreground/40" : "text-muted-foreground"
          )}>
            {category.completedCount}/{category.versesCount}
          </span>
        </div>
      </div>

      <ChevronRight className={cn(
        "h-5 w-5",
        category.isLocked ? "text-muted-foreground/30" : "text-muted-foreground"
      )} />
    </motion.button>
  );
}

function DailyVerseCard({ verse }: { verse: DailyVerse }) {
  const [, setLocation] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card 
        className="overflow-hidden border-2 border-[#FFC800]/30"
        data-testid="daily-verse-card"
      >
        <div 
          className="p-4"
          style={{
            background: 'linear-gradient(135deg, #FFC800 0%, #FFD633 100%)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-white" />
            <span className="text-sm font-bold text-white/90">Versículo do Dia</span>
          </div>
          <p className="text-white font-bold text-lg">{verse.reference}</p>
        </div>
        
        <div className="p-4">
          <p className="text-foreground text-base italic leading-relaxed mb-4">
            "{verse.text}"
          </p>
          
          <Button
            onClick={() => setLocation("/study/verses")}
            className="w-full font-bold bg-[#FFC800] hover:bg-[#E6B400] text-[#7A5C00]"
            style={{ boxShadow: '0 4px 0 0 #CC9F00' }}
            data-testid="button-read-daily-verse"
          >
            {verse.isCompleted ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                CONCLUÍDO
              </span>
            ) : (
              "LER AGORA"
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function HeartsRecoveryCard() {
  const [, setLocation] = useLocation();
  const currentHearts = 3;
  const maxHearts = 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card 
        className="p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-red-200 dark:border-red-900"
        data-testid="hearts-recovery-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground mb-1">Recuperar Vidas</p>
            <p className="text-sm text-muted-foreground">
              Leia versículos para ganhar vidas
            </p>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxHearts }).map((_, i) => (
              <Heart
                key={i}
                className={cn(
                  "h-5 w-5 transition-colors",
                  i < currentHearts 
                    ? "fill-[#FF4B4B] text-[#FF4B4B]" 
                    : "fill-gray-200 text-gray-300 dark:fill-gray-700"
                )}
              />
            ))}
          </div>
        </div>
        
        {currentHearts < maxHearts && (
          <Button
            onClick={() => setLocation("/study/verses")}
            variant="outline"
            className="w-full mt-3 font-bold border-[#FF4B4B] text-[#FF4B4B]"
            data-testid="button-recover-hearts"
          >
            <Heart className="h-4 w-4 mr-2 fill-[#FF4B4B]" />
            RECUPERAR {maxHearts - currentHearts} VIDA{maxHearts - currentHearts > 1 ? 'S' : ''}
          </Button>
        )}
      </Card>
    </motion.div>
  );
}

export default function ExplorePage() {
  const [, setLocation] = useLocation();

  const handleCategoryClick = (categoryId: string) => {
    setLocation(`/study/verses?category=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="explore-page">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-center gap-2 p-4">
          <Compass className="h-6 w-6 text-[#1CB0F6]" />
          <h1 className="font-black text-xl">Explorar</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        <DailyVerseCard verse={mockDailyVerse} />
        
        <HeartsRecoveryCard />

        <div>
          <h2 className="font-bold text-lg text-foreground mb-4">Categorias de Versículos</h2>
          
          <div className="space-y-3">
            {mockCategories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() => handleCategoryClick(category.id)}
                index={index}
              />
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
