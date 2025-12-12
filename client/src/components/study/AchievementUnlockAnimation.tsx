import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Flame, BookOpen, Star, Medal, Award, Crown, Zap,
  Heart, Target, CheckCircle, Calendar, Sunrise, Moon,
  BookMarked, BookHeart, Shield, GraduationCap, TrendingUp, Sparkles, Book
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSounds } from "@/hooks/use-sounds";

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: string;
}

interface AchievementUnlockAnimationProps {
  achievement: Achievement;
  onComplete: () => void;
  className?: string;
}

const iconMap: Record<string, typeof Flame> = {
  flame: Flame,
  book: Book,
  "book-open": BookOpen,
  "book-heart": BookHeart,
  "book-marked": BookMarked,
  "graduation-cap": GraduationCap,
  trophy: Trophy,
  crown: Crown,
  star: Star,
  stars: Sparkles,
  award: Award,
  zap: Zap,
  shield: Shield,
  medal: Medal,
  sunrise: Sunrise,
  moon: Moon,
  calendar: Calendar,
  heart: Heart,
  target: Target,
  "check-circle": CheckCircle,
  "calendar-check": Calendar,
  "trending-up": TrendingUp,
};

const categoryColors: Record<string, { primary: string; secondary: string; gradient: string }> = {
  streak: { 
    primary: "#FF9600", 
    secondary: "#FF6B00",
    gradient: "from-orange-400 via-orange-500 to-red-500"
  },
  lessons: { 
    primary: "#58CC02", 
    secondary: "#45A302",
    gradient: "from-green-400 via-green-500 to-emerald-600"
  },
  xp: { 
    primary: "#FFC800", 
    secondary: "#FFAB00",
    gradient: "from-yellow-400 via-amber-500 to-orange-500"
  },
  special: { 
    primary: "#1CB0F6", 
    secondary: "#0D9DE5",
    gradient: "from-blue-400 via-cyan-500 to-teal-500"
  },
};

function getIconComponent(iconName: string) {
  return iconMap[iconName.toLowerCase()] || Trophy;
}

function getCategoryStyle(category: string) {
  return categoryColors[category] || categoryColors.special;
}

export function AchievementUnlockAnimation({
  achievement,
  onComplete,
  className
}: AchievementUnlockAnimationProps) {
  const [showButton, setShowButton] = useState(false);
  const { sounds } = useSounds();
  const hasPlayedSound = useRef(false);
  
  const IconComponent = getIconComponent(achievement.icon);
  const categoryStyle = getCategoryStyle(achievement.category);

  useEffect(() => {
    if (!hasPlayedSound.current) {
      sounds.achievement();
      hasPlayedSound.current = true;
    }
    
    const timer = setTimeout(() => setShowButton(true), 1500);
    return () => clearTimeout(timer);
  }, [sounds]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center p-6",
        "bg-background/95 backdrop-blur-sm",
        className
      )}
      data-testid="achievement-unlock-animation"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm"
      >
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground mb-4 font-medium"
        >
          Conquista Desbloqueada!
        </motion.p>

        <motion.div
          className="relative mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.3
          }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatDelay: 0.5
            }}
            className="relative inline-block"
          >
            <div 
              className={cn(
                "w-28 h-28 rounded-full flex items-center justify-center",
                `bg-gradient-to-br ${categoryStyle.gradient}`
              )}
              style={{
                boxShadow: `0 0 60px ${categoryStyle.primary}80`
              }}
            >
              <IconComponent className="h-14 w-14 text-white drop-shadow-lg" />
            </div>
            
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={cn(
                "absolute inset-0 rounded-full -z-10",
                `bg-gradient-to-br ${categoryStyle.gradient}`
              )}
            />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-black mb-2"
          style={{ color: categoryStyle.primary }}
        >
          {achievement.name}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground mb-6"
        >
          {achievement.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <Zap className="h-6 w-6 text-amber-500" />
          <span className="text-2xl font-bold text-amber-500">+{achievement.xpReward} XP</span>
        </motion.div>

        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full"
            >
              <Button
                onClick={onComplete}
                className={cn(
                  "w-full py-6 text-lg font-black uppercase tracking-wide",
                  "bg-gradient-to-r from-[#1CB0F6] to-[#1899D6]",
                  "shadow-[0_6px_0_0_#1480B8]",
                  "hover:shadow-[0_4px_0_0_#1480B8] hover:translate-y-[2px]",
                  "active:shadow-[0_2px_0_0_#1480B8] active:translate-y-[4px]",
                  "transition-all duration-100"
                )}
                data-testid="button-continue-achievement"
              >
                Continuar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1, 
            scale: 0,
            x: 0,
            y: 0
          }}
          animate={{ 
            opacity: 0,
            scale: 1,
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 500
          }}
          transition={{ 
            duration: 2,
            delay: 0.3 + i * 0.05,
            ease: "easeOut"
          }}
          className="absolute top-1/2 left-1/2"
          style={{
            width: 8 + Math.random() * 12,
            height: 8 + Math.random() * 12,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${categoryStyle.primary}, ${categoryStyle.secondary})`
          }}
        />
      ))}
    </div>
  );
}
