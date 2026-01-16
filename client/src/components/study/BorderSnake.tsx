import type { CardRarity } from "./CollectibleCard";

interface BorderSnakeProps {
  rarity: Exclude<CardRarity, "common">;
  width: number;
  height: number;
  borderRadius?: number;
}

const rarityConfig = {
  rare: {
    color: "#00BFFF",
    glowColor: "rgba(0, 191, 255, 0.8)",
    shadowColor: "rgba(0, 191, 255, 0.6)",
    duration: 2.5,
    dashLength: 40,
  },
  epic: {
    color: "#A855F7",
    glowColor: "rgba(168, 85, 247, 0.8)",
    shadowColor: "rgba(168, 85, 247, 0.6)",
    duration: 3,
    dashLength: 50,
  },
  legendary: {
    color: "#FF8C00",
    glowColor: "rgba(255, 140, 0, 0.9)",
    shadowColor: "rgba(255, 69, 0, 0.7)",
    duration: 2,
    dashLength: 60,
  },
};

export function BorderSnake({ rarity, width, height, borderRadius = 16 }: BorderSnakeProps) {
  const config = rarityConfig[rarity];
  const perimeter = 2 * (width + height - 4 * borderRadius) + 2 * Math.PI * borderRadius;
  const dashArray = `${config.dashLength} ${perimeter - config.dashLength}`;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ 
        overflow: "visible",
        zIndex: 3,
      }}
    >
      <defs>
        <filter id={`glow-${rarity}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {rarity === "legendary" && (
          <linearGradient id="flame-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="30%" stopColor="#FF8C00" />
            <stop offset="60%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        )}
      </defs>
      <rect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        rx={borderRadius - 2}
        ry={borderRadius - 2}
        fill="none"
        stroke={config.shadowColor}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={dashArray}
        filter={`url(#glow-${rarity})`}
        style={{
          animation: `snake-travel-${rarity} ${config.duration}s linear infinite`,
        }}
      />
      <rect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        rx={borderRadius - 2}
        ry={borderRadius - 2}
        fill="none"
        stroke={rarity === "legendary" ? "url(#flame-gradient)" : config.color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={dashArray}
        style={{
          animation: `snake-travel-${rarity} ${config.duration}s linear infinite`,
        }}
      />
      <style>{`
        @keyframes snake-travel-rare {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -${perimeter}px; }
        }
        @keyframes snake-travel-epic {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -${perimeter}px; }
        }
        @keyframes snake-travel-legendary {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -${perimeter}px; }
        }
      `}</style>
    </svg>
  );
}
