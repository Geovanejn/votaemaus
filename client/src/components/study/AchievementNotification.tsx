import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  Star,
  Medal,
  Zap,
  Crown,
  Award,
  TrendingUp,
  Heart,
  Sunrise,
  Moon,
  Calendar,
  CheckCircle,
  CalendarCheck,
  BookMarked,
  BookHeart,
  Shield,
  GraduationCap,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: string;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  show: boolean;
  onClose: () => void;
}

const iconMap: Record<string, typeof Flame> = {
  flame: Flame,
  book: BookOpen,
  "book-open": BookOpen,
  "book-heart": BookHeart,
  "book-marked": BookMarked,
  "graduation-cap": GraduationCap,
  trophy: Trophy,
  crown: Crown,
  star: Star,
  stars: Star,
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
  "calendar-check": CalendarCheck,
  "trending-up": TrendingUp,
};

function getIconComponent(iconName: string) {
  return iconMap[iconName.toLowerCase()] || Star;
}

export function AchievementNotification({ achievement, show, onClose }: AchievementNotificationProps) {
  if (!achievement) return null;

  const IconComponent = getIconComponent(achievement.icon);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          data-testid="achievement-notification-overlay"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-900/90 dark:to-amber-800/90 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl border-2 border-amber-300 dark:border-amber-600"
            onClick={(e) => e.stopPropagation()}
            data-testid="achievement-notification-modal"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-amber-600 dark:text-amber-400"
              onClick={onClose}
              data-testid="button-close-achievement"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 10, stiffness: 200 }}
                className="inline-block mb-4"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg relative">
                  <IconComponent className="h-12 w-12 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-amber-300"
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                  Nova Conquista!
                </p>
                <h2 className="text-2xl font-black text-amber-800 dark:text-amber-200 mb-2">
                  {achievement.name}
                </h2>
                <p className="text-amber-700 dark:text-amber-300 mb-4">
                  {achievement.description}
                </p>

                <div className="flex items-center justify-center gap-2 bg-amber-200/50 dark:bg-amber-700/50 rounded-lg py-2 px-4 mb-4">
                  <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    +{achievement.xpReward} XP
                  </span>
                </div>

                <Button 
                  onClick={onClose}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
                  data-testid="button-continue-achievement"
                >
                  Continuar
                </Button>
              </motion.div>
            </div>

            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#FFA500', '#FFD700', '#FF9600', '#FFE55C'][i % 4],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1, 0], 
                  opacity: [0, 1, 0],
                  y: [0, -50, -100]
                }}
                transition={{ 
                  delay: 0.5 + i * 0.05, 
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState, useCallback } from "react";

export function useAchievementNotification() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [show, setShow] = useState(false);

  const showAchievement = useCallback((achievement: Achievement) => {
    setCurrentAchievement(achievement);
    setShow(true);
  }, []);

  const hideAchievement = useCallback(() => {
    setShow(false);
    setTimeout(() => setCurrentAchievement(null), 300);
  }, []);

  const AchievementComponent = useCallback(() => (
    <AchievementNotification
      achievement={currentAchievement}
      show={show}
      onClose={hideAchievement}
    />
  ), [currentAchievement, show, hideAchievement]);

  return {
    showAchievement,
    hideAchievement,
    isShowing: show,
    AchievementComponent,
  };
}
