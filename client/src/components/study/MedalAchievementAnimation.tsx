import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Flame, 
  Star,
  Medal,
  Crown,
  Award,
  Zap,
  Heart,
  BookOpen,
  Target,
  Shield,
  GraduationCap,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSounds } from "@/hooks/use-sounds";
import { useEffect, useRef } from "react";

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: string;
}

interface MedalAchievementAnimationProps {
  achievement: Achievement | null;
  show: boolean;
  onClose: () => void;
}

const iconMap: Record<string, typeof Medal> = {
  flame: Flame,
  book: BookOpen,
  "book-open": BookOpen,
  trophy: Trophy,
  crown: Crown,
  star: Star,
  stars: Star,
  award: Award,
  zap: Zap,
  shield: Shield,
  medal: Medal,
  heart: Heart,
  target: Target,
  "graduation-cap": GraduationCap,
};

function getIconComponent(iconName: string) {
  return iconMap[iconName.toLowerCase()] || Medal;
}

export function MedalAchievementAnimation({ achievement, show, onClose }: MedalAchievementAnimationProps) {
  const { sounds } = useSounds();
  const hasPlayedRef = useRef(false);
  
  useEffect(() => {
    if (show && achievement && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      sounds.medal();
      setTimeout(() => sounds.achievement(), 400);
      setTimeout(() => sounds.xp(), 800);
    } else if (!show) {
      hasPlayedRef.current = false;
    }
  }, [show, achievement, sounds]);
  
  if (!achievement) return null;

  const IconComponent = getIconComponent(achievement.icon);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={onClose}
          data-testid="medal-achievement-overlay"
        >
          <motion.div
            initial={{ scale: 0, rotate: -360 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 360 }}
            transition={{ type: "spring", damping: 12, stiffness: 150, duration: 1 }}
            className="relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            data-testid="medal-achievement-modal"
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ scale: 0 }}
              animate={{ 
                scale: [0, 3, 4],
                opacity: [0.8, 0.3, 0]
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%)'
              }}
            />

            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <motion.div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl relative overflow-visible"
                animate={{ 
                  boxShadow: [
                    '0 0 30px rgba(255, 215, 0, 0.5)',
                    '0 0 60px rgba(255, 215, 0, 0.8)',
                    '0 0 30px rgba(255, 215, 0, 0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <IconComponent className="h-16 w-16 text-amber-900" />
                </motion.div>

                <motion.div
                  className="absolute -inset-2 rounded-full border-4 border-yellow-300/50"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />

                <motion.div
                  className="absolute -inset-4 rounded-full border-2 border-yellow-200/30"
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
              </motion.div>

              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ 
                    x: Math.cos((i / 12) * Math.PI * 2) * 100,
                    y: Math.sin((i / 12) * Math.PI * 2) * 100,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5]
                  }}
                  transition={{ 
                    delay: 0.5 + i * 0.05,
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-8"
            >
              <motion.p 
                className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Nova Conquista Desbloqueada!
              </motion.p>
              <motion.h2 
                className="text-3xl font-black text-white mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
              >
                {achievement.name}
              </motion.h2>
              <p className="text-gray-300 mb-4 max-w-xs">
                {achievement.description}
              </p>

              <motion.div 
                className="flex items-center justify-center gap-2 bg-amber-500/20 rounded-full py-2 px-6 mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: "spring" }}
              >
                <Zap className="h-5 w-5 text-amber-400" />
                <span className="font-bold text-amber-400">
                  +{achievement.xpReward} XP
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                <Button 
                  onClick={onClose}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-900 font-bold px-8 shadow-lg"
                  data-testid="button-close-medal"
                >
                  Incrivel!
                </Button>
              </motion.div>
            </motion.div>

            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0,
                  opacity: 0 
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  delay: 0.3 + i * 0.02,
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#FFD700', '#FFA500', '#FF9600', '#FFE55C', '#FFCC00'][i % 5]
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
