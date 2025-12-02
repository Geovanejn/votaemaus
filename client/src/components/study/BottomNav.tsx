import { Home, Trophy, User, Book } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  activeColor: string;
}

const navItems: NavItem[] = [
  { href: "/study", icon: Home, label: "Inicio", activeColor: "#FFA500" },
  { href: "/study/verses", icon: Book, label: "Versiculos", activeColor: "#58CC02" },
  { href: "/study/ranking", icon: Trophy, label: "Ranking", activeColor: "#FFD700" },
  { href: "/study/profile", icon: User, label: "Perfil", activeColor: "#FF9600" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 safe-area-bottom" 
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/study" && location.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="relative flex-1"
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 mx-1 rounded-xl transition-colors",
                  isActive 
                    ? "bg-muted/80" 
                    : "hover:bg-muted/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <item.icon 
                    className={cn(
                      "h-6 w-6 transition-all duration-200",
                      isActive 
                        ? "stroke-[2.5]"
                        : "text-muted-foreground stroke-[1.5]"
                    )}
                    style={isActive ? { color: item.activeColor } : undefined}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: item.activeColor }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span 
                  className={cn(
                    "text-[10px] font-semibold transition-colors",
                    isActive 
                      ? "text-foreground" 
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
