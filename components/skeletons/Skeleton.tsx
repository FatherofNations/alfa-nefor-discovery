import type { CSSProperties, ReactNode } from "react";

/* Блок скелетона — повторяет core-ds Skeleton (packages/skeleton):
   контент скрыт (visibility: hidden), на его место ложится фон-заглушка и
   «дышащий» слой. Геометрия задаётся style/className как у core-ds. */

export type SkeletonRadius = 0 | 2 | 4 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 36 | 64 | "pill";

type SkeletonProps = {
  animate?: boolean;
  borderRadius?: SkeletonRadius;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export default function Skeleton({
  animate = true,
  borderRadius = 8,
  className,
  style,
  children,
}: SkeletonProps) {
  const radius = borderRadius === "pill" ? 999 : borderRadius;

  return (
    <span
      className={`sk${animate ? " sk-animate" : ""}${className ? ` ${className}` : ""}`}
      style={{ borderRadius: radius, ...style }}
    >
      {children}
    </span>
  );
}
