import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ width, height = 16, borderRadius = 8, className = "", style }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className={styles.skeletonCard}>
      <Skeleton width={40} height={40} borderRadius="50%" />
      <div className={styles.skeletonCardBody}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            width={i === 0 ? "60%" : i === lines - 1 ? "40%" : "80%"}
            height={i === 0 ? 14 : 10}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className={styles.skeletonRow}>
      <Skeleton width={44} height={44} borderRadius={12} />
      <div className={styles.skeletonRowText}>
        <Skeleton width="50%" height={14} />
        <Skeleton width="30%" height={10} />
      </div>
      <Skeleton width={60} height={16} />
    </div>
  );
}
