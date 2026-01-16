import type { CardRarity } from "./CollectibleCard";

interface BorderSnakeProps {
  rarity: Exclude<CardRarity, "common">;
  width: number;
  height: number;
  borderRadius?: number;
}

const rarityConfig = {
  rare: {
    colors: ["#00FFFF", "#00BFFF", "#0088FF", "#0066CC"],
    glowColor: "rgba(0, 191, 255, 0.5)",
    duration: 2.5,
    dashLength: 280,
  },
  epic: {
    colors: ["#E0AAFF", "#C77DFF", "#9D4EDD", "#7B2CBF"],
    glowColor: "rgba(168, 85, 247, 0.5)",
    duration: 3,
    dashLength: 350,
  },
  legendary: {
    colors: ["#FFFFFF", "#FFD700", "#FF8C00", "#FF4500"],
    glowColor: "rgba(255, 140, 0, 0.5)",
    duration: 2,
    dashLength: 420,
  },
};

export function BorderSnake({ rarity, width, height, borderRadius = 16 }: BorderSnakeProps) {
  const config = rarityConfig[rarity];
  const offset = 6;
  const rectWidth = width + offset * 2;
  const rectHeight = height + offset * 2;
  const adjustedRadius = borderRadius + offset;
  
  const perimeter = 2 * (rectWidth + rectHeight - 4 * adjustedRadius) + 2 * Math.PI * adjustedRadius;
  
  const layers = [
    { opacity: 0.15, width: 28, blur: 20 },
    { opacity: 0.25, width: 20, blur: 14 },
    { opacity: 0.4, width: 14, blur: 8 },
    { opacity: 0.7, width: 8, blur: 4 },
    { opacity: 1, width: 4, blur: 0 },
  ];

  return (
    <svg
      className="absolute pointer-events-none"
      style={{ 
        top: -offset,
        left: -offset,
        overflow: "visible",
        zIndex: 3,
      }}
      width={rectWidth}
      height={rectHeight}
      viewBox={`0 0 ${rectWidth} ${rectHeight}`}
    >
      <defs>
        {layers.map((layer, i) => (
          <filter key={`filter-${i}`} id={`glow-${rarity}-${i}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={layer.blur} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
        <linearGradient id={`gradient-${rarity}`} x1="0%" y1="0%" x2="100%" y2="0%">
          {config.colors.map((color, i) => (
            <stop key={i} offset={`${i * 33}%`} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      
      {layers.map((layer, i) => (
        <rect
          key={i}
          x={layer.width / 2}
          y={layer.width / 2}
          width={rectWidth - layer.width}
          height={rectHeight - layer.width}
          rx={adjustedRadius - layer.width / 2}
          ry={adjustedRadius - layer.width / 2}
          fill="none"
          stroke={i < 3 ? config.glowColor : `url(#gradient-${rarity})`}
          strokeWidth={layer.width}
          strokeLinecap="round"
          strokeDasharray={`${config.dashLength} ${perimeter - config.dashLength}`}
          opacity={layer.opacity}
          filter={layer.blur > 0 ? `url(#glow-${rarity}-${i})` : undefined}
          style={{
            animation: `snake-travel-${rarity} ${config.duration}s linear infinite`,
          }}
        />
      ))}
      
      <style>{`
        @keyframes snake-travel-${rarity} {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -${perimeter}px; }
        }
      `}</style>
    </svg>
  );
}
