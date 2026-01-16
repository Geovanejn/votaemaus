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
    glowColor: "rgba(0, 255, 255, 0.5)",
    duration: 3,
    dashLength: 160,
  },
  epic: {
    color: "#C77DFF",
    glowColor: "rgba(200, 125, 255, 0.5)",
    duration: 3.5,
    dashLength: 200,
  },
  legendary: {
    color: "#FFD700",
    glowColor: "rgba(255, 200, 0, 0.6)",
    duration: 2.5,
    dashLength: 240,
  },
};

export function BorderSnake({ rarity, width, height, borderRadius = 16 }: BorderSnakeProps) {
  const uniqueId = useId();
  const config = rarityConfig[rarity];
  const offset = 14;
  const svgWidth = width + offset * 2;
  const svgHeight = height + offset * 2;
  const adjustedRadius = borderRadius + offset / 2;
  
  const perimeter = 2 * (width + height) + 2 * Math.PI * adjustedRadius;
  
  const animationName = `snake-${uniqueId.replace(/:/g, '')}`;
  const blurSoftId = `blur-soft-${uniqueId.replace(/:/g, '')}`;
  const blurMediumId = `blur-med-${uniqueId.replace(/:/g, '')}`;
  const blurHeavyId = `blur-heavy-${uniqueId.replace(/:/g, '')}`;

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
          <filter id={blurHeavyId} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="24" />
          </filter>
          <filter id={blurMediumId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id={blurSoftId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" />
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
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${config.dashLength} ${perimeter - config.dashLength}`}
          opacity="0.2"
          filter={`url(#${blurHeavyId})`}
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
          stroke={config.glowColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${config.dashLength} ${perimeter - config.dashLength}`}
          opacity="0.35"
          filter={`url(#${blurMediumId})`}
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
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${config.dashLength * 0.6} ${perimeter - config.dashLength * 0.6}`}
          opacity="0.6"
          filter={`url(#${blurSoftId})`}
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
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${config.dashLength * 0.3} ${perimeter - config.dashLength * 0.3}`}
          opacity="0.95"
          filter={`url(#${blurSoftId})`}
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
