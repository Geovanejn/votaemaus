import { useId } from "react";
import type { CardRarity } from "./CollectibleCard";

interface BorderSnakeProps {
  rarity: Exclude<CardRarity, "common">;
  width: number;
  height: number;
  borderRadius?: number;
}

const rarityConfig = {
  rare: {
    color: "#00FFFF",
    glowColor: "rgba(0, 255, 255, 0.8)",
    duration: 2.5,
    dashLength: 200,
  },
  epic: {
    color: "#C77DFF",
    glowColor: "rgba(200, 125, 255, 0.8)",
    duration: 3,
    dashLength: 250,
  },
  legendary: {
    color: "#FFD700",
    glowColor: "rgba(255, 200, 0, 0.8)",
    duration: 2,
    dashLength: 300,
  },
};

export function BorderSnake({ rarity, width, height, borderRadius = 16 }: BorderSnakeProps) {
  const uniqueId = useId();
  const config = rarityConfig[rarity];
  const offset = 10;
  const svgWidth = width + offset * 2;
  const svgHeight = height + offset * 2;
  const adjustedRadius = borderRadius + offset / 2;
  
  const perimeter = 2 * (width + height) + 2 * Math.PI * adjustedRadius;
  
  const animationName = `snake-${uniqueId.replace(/:/g, '')}`;

  return (
    <div
      style={{
        position: "absolute",
        top: -offset,
        left: -offset,
        width: svgWidth,
        height: svgHeight,
        pointerEvents: "none",
        zIndex: 100,
        overflow: "visible",
      }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter id={`blur-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <rect
          x={offset / 2}
          y={offset / 2}
          width={width + offset}
          height={height + offset}
          rx={adjustedRadius}
          ry={adjustedRadius}
          fill="none"
          stroke={config.glowColor}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${config.dashLength} ${perimeter - config.dashLength}`}
          filter={`url(#blur-${uniqueId})`}
          style={{
            animation: `${animationName} ${config.duration}s linear infinite`,
          }}
        />
        
        <rect
          x={offset / 2}
          y={offset / 2}
          width={width + offset}
          height={height + offset}
          rx={adjustedRadius}
          ry={adjustedRadius}
          fill="none"
          stroke={config.color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${config.dashLength} ${perimeter - config.dashLength}`}
          style={{
            animation: `${animationName} ${config.duration}s linear infinite`,
          }}
        />
        
        <style>{`
          @keyframes ${animationName} {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -${perimeter}px; }
          }
        `}</style>
      </svg>
    </div>
  );
}
