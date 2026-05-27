import { useState } from "react";

interface Props {
  matrix: number[][];
  labels: string[];
}

function cellIntensity(count: number, maxCount: number): string {
  if (maxCount === 0) return "rgb(240,240,240)";
  const t = count / maxCount;
  const r = Math.round((1 - t) * 255);
  const g = Math.round((1 - t) * 255);
  const b = Math.round((1 - t) * 255 + t * 180);
  return `rgb(${r},${g},${b})`;
}

const CELL = 56;
const LABEL_OFFSET = 80;

export function ConfusionMatrix({ matrix, labels }: Props) {
  const [tooltip, setTooltip] = useState<{ actual: string; predicted: string; count: number } | null>(null);
  const maxCount = Math.max(...matrix.flat());
  const n = labels.length;

  const svgWidth  = LABEL_OFFSET + n * CELL;
  const svgHeight = LABEL_OFFSET + n * CELL;

  return (
    <div>
      {tooltip && (
        <div style={{
          position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
          background: "#1E293B", color: "#fff", padding: "6px 14px",
          borderRadius: 8, fontSize: "0.85rem", zIndex: 50, pointerEvents: "none",
        }}>
          Actual: <b>{tooltip.actual}</b> → Predicted: <b>{tooltip.predicted}</b>: {tooltip.count}
        </div>
      )}

      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 6 }}>
        Rows = Actual, Columns = Predicted
      </div>

      <div className="heatmap-scroll">
        <svg width={svgWidth} height={svgHeight} style={{ display: "block" }}>
          {/* Column labels */}
          {labels.map((lbl, ci) => (
            <text
              key={`cl-${ci}`}
              x={LABEL_OFFSET + ci * CELL + CELL / 2}
              y={LABEL_OFFSET - 6}
              textAnchor="start"
              fontSize={10}
              fill="var(--color-text-muted)"
              transform={`rotate(-35, ${LABEL_OFFSET + ci * CELL + CELL / 2}, ${LABEL_OFFSET - 6})`}
            >
              {lbl.length > 10 ? lbl.slice(0, 9) + "…" : lbl}
            </text>
          ))}

          {/* Row labels */}
          {labels.map((lbl, ri) => (
            <text
              key={`rl-${ri}`}
              x={LABEL_OFFSET - 6}
              y={LABEL_OFFSET + ri * CELL + CELL / 2 + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--color-text-muted)"
            >
              {lbl.length > 10 ? lbl.slice(0, 9) + "…" : lbl}
            </text>
          ))}

          {matrix.map((row, ri) =>
            row.map((count, ci) => {
              const x = LABEL_OFFSET + ci * CELL;
              const y = LABEL_OFFSET + ri * CELL;
              const bg = cellIntensity(count, maxCount);
              const textFill = count / maxCount > 0.5 ? "#fff" : "#1E293B";
              return (
                <g key={`${ri}-${ci}`}>
                  <rect
                    x={x} y={y} width={CELL} height={CELL}
                    fill={bg}
                    stroke="var(--color-border)" strokeWidth={0.5}
                    onMouseEnter={() =>
                      setTooltip({ actual: labels[ri], predicted: labels[ci], count })
                    }
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: "crosshair" }}
                  />
                  <text
                    x={x + CELL / 2} y={y + CELL / 2 + 4}
                    textAnchor="middle" fontSize={11}
                    fill={textFill} pointerEvents="none"
                  >
                    {count}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
}
