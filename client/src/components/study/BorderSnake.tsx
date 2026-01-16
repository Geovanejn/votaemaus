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
    glowColor: "rgba(0, 255, 255, 0.7)",
    duration: 3,
    dashLength: 140,
  },
  epic: {
    color: "#C77DFF",
    glowColor: "rgba(200, 125, 255, 0.7)",
    duration: 3.5,
    dashLength: 180,
  },
  legendary: {
    color: "#FFD700",
    glowColor: "rgba(255, 200, 0, 0.8)",
    duration: 2.5,
    dashLength: 220,
  },
};

export function BorderSnake({ rarity, width, height, borderRadius = 16 }: BorderSnakeProps) {
  const uniqueId = useId();
  const config = rarityConfig[rarity];
  const offset = 4;
  const svgWidth = width + offset * 2;
  const svgHeight = height + offset * 2;
  const adjustedRadius = borderRadius;
  
  const perimeter = 2 * (width + height) + 2 * Math.PI * adjustedRadius;
  
  const animationPrefix = `snake-${uniqueId.replace(/:/g, '')}`;
  const blurSoftId = `blur-soft-${uniqueId.replace(/:/g, '')}`;
  const blurMediumId = `blur-med-${uniqueId.replace(/:/g, '')}`;

  const headDash = config.dashLength * 0.25;
  const midDash = config.dashLength * 0.5;
  const tailDash = config.dashLength;

  const headStart = headDash;
  const midStart = midDash;
  const tailStart = tailDash;

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
          <filter id={blurMediumId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id={blurSoftId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        
        <rect
          x={offset}
          y={offset}
          width={width}
          height={height}
          rx={adjustedRadius}
          ry={adjustedRadius}
          fill="none"
          stroke={config.glowColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${tailDash} ${perimeter - tailDash}`}
          opacity="0.25"
          filter={`url(#${blurMediumId})`}
          style={{
            animation: `${animationPrefix}-tail ${config.duration}s linear infinite`,
          }}
        />
        
        <rect
          x={offset}
          y={offset}
          width={width}
          height={height}
          rx={adjustedRadius}
          ry={adjustedRadius}
          fill="none"
          stroke={config.color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${midDash} ${perimeter - midDash}`}
          opacity="0.6"
          filter={`url(#${blurSoftId})`}
          style={{
            animation: `${animationPrefix}-mid ${config.duration}s linear infinite`,
          }}
        />
        
        <rect
          x={offset}
          y={offset}
          width={width}
          height={height}
          rx={adjustedRadius}
          ry={adjustedRadius}
          fill="none"
          stroke={config.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${headDash} ${perimeter - headDash}`}
          opacity="1"
          style={{
            animation: `${animationPrefix}-head ${config.duration}s linear infinite`,
          }}
        />
        
        <style>{`
          @keyframes ${animationPrefix}-tail {
            0% { stroke-dashoffset: ${tailStart}px; }
            100% { stroke-dashoffset: ${tailStart + perimeter}px; }
          }
          @keyframes ${animationPrefix}-mid {
            0% { stroke-dashoffset: ${midStart}px; }
            100% { stroke-dashoffset: ${midStart + perimeter}px; }
          }
          @keyframes ${animationPrefix}-head {
            0% { stroke-dashoffset: ${headStart}px; }
            100% { stroke-dashoffset: ${headStart + perimeter}px; }
          }
        `}</style>
      </svg>
    </div>
  );
}
