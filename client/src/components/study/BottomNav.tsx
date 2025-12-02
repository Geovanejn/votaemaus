import { Home, Trophy, User, Book } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/study", icon: Home, label: "Início" },
  { href: "/study/verses", icon: Book, label: "Versículos" },
  { href: "/study/ranking", icon: Trophy, label: "Ranking" },
  { href: "/study/profile", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-bottom" data-testid="bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/study" && location.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
