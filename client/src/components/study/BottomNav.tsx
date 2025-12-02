import { Home, Trophy, User, Book, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItem {
  href: string;
  icon: typeof Home;
  iconFilled?: typeof Home;
  label: string;
  activeColor: string;
}

const navItems: NavItem[] = [
  { href: "/study", icon: Home, label: "Inicio", activeColor: "#FFA500" },
  { href: "/study/verses", icon: Book, label: "Versiculos", activeColor: "#58CC02" },
  { href: "/study/ranking", icon: Trophy, label: "Ranking", activeColor: "#1CB0F6" },
  { href: "/study/profile", icon: User, label: "Perfil", activeColor: "#FF9600" },
  { href: "/study/more", icon: MoreHorizontal, label: "Mais", activeColor: "#AFAFAF" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background border-t border-border",
        "safe-area-bottom"
      )}
      data-testid="bottom-nav"
    >
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/study" && item.href !== "/study/more" && location.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex-1"
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-full",
                  "transition-colors relative"
                )}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="relative"
                >
                  <item.icon 
                    className={cn(
                      "h-7 w-7 transition-all duration-200",
                      isActive 
                        ? "stroke-[2.5]"
                        : "text-muted-foreground/60 stroke-[1.5]"
                    )}
                    style={isActive ? { color: item.activeColor } : undefined}
                  />
                </motion.div>
                
                <span 
                  className={cn(
                    "text-[10px] font-bold transition-colors",
                    isActive 
                      ? "text-foreground" 
                      : "text-muted-foreground/60"
                  )}
                >
                  {item.label}
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="nav-active-indicator"
                    className="absolute -top-0.5 w-12 h-1 rounded-full"
                    style={{ backgroundColor: item.activeColor }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
