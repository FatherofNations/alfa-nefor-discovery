import Skeleton from "./Skeleton";

/* Строки текста в скелетоне — по тому же принципу, что useSkeleton в core-ds:
   каждая строка — «пилюля», вмещающая глиф, внутри строки заданного
   line-height. Высота глифа ≈ 0.72 кегля (actualBoundingBoxAscent у
   Alfa Interface Sans), остальное делится поровну на padding сверху/снизу.
   Ширины задаются по строкам массивом — как width: [...] в useSkeleton. */

export type SkeletonTextWidth = number | string;

type SkeletonTextProps = {
  fontSize: number;
  lineHeight: number;
  width?: SkeletonTextWidth;
  widths?: SkeletonTextWidth[];
  rows?: number;
  align?: "left" | "center" | "right";
  animate?: boolean;
  className?: string;
};

const GLYPH_RATIO = 0.72;

export default function SkeletonText({
  fontSize,
  lineHeight,
  width,
  widths,
  rows = 1,
  align = "left",
  animate = true,
  className,
}: SkeletonTextProps) {
  const glyph = Math.round(fontSize * GLYPH_RATIO);
  const padding = Math.max(0, Math.round((lineHeight - glyph) / 2));
  const alignClass =
    align === "center" ? " sk-line-align-center" : align === "right" ? " sk-line-align-right" : "";

  return (
    <span className={`sk-line${alignClass}${className ? ` ${className}` : ""}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index} className="sk-line-in" style={{ width: widths?.[index] ?? width }}>
          <span style={{ display: "block", padding: `${padding}px 0` }}>
            <Skeleton style={{ height: glyph }} borderRadius="pill" animate={animate} />
          </span>
        </span>
      ))}
    </span>
  );
}
