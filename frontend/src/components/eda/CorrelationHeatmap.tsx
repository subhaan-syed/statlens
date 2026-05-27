import { useState } from "react";
import type { CorrelationData } from "../../types";

interface Props {
  data: CorrelationData;
}

/** Interpolate red(−1) → white(0) → blue(+1) */
function corrToRGB(value: number): string {
  const v = Math.max(-1, Math.min(1, value));
  let r: number, g: number, b: number;
  if (v < 0) {
    const t = v + 1; // 0..1
    r = 255;
    g = Math.round(t * 255);
    b = Math.round(t * 255);
  } else {
    const t = v; // 0..1
    r = Math.round((1 - t) * 255);
    g = Math.round((1 - t) * 255);
    b = Math.round((1 - t) * 255 + t * 180);
  }
  return `rgb(${r},${g},${b})`;
}

function textColor(value: number): string {
  return Math.abs(value) > 0.5 ? "#fff" : "#1E293B";
}

const CELL = 60;
const LABEL_OFFSET = 90; // room for rotated labels

export function CorrelationHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ row: string; col: string; value: number } | null>(null);

  const { columns, matrix } = data;
  const n = columns.length;

  if (n === 0) return <p style={{ color: "var(--color-text-muted)" }}>No numeric columns found.</p>;

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
          {tooltip.row} × {tooltip.col}: <strong>{tooltip.value.toFixed(4)}</strong>
        </div>
      )}

      <div className="heatmap-scroll">
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{ display: "block", maxWidth: "100%" }}
          role="img"
          aria-label="Pearson correlation heatmap"
        >
          {/* Column labels (rotated) */}
          {columns.map((col, ci) => (
            <text
              key={`col-${ci}`}
              x={LABEL_OFFSET + ci * CELL + CELL / 2}
              y={LABEL_OFFSET - 6}
              textAnchor="start"
              fontSize={11}
              fill="var(--color-text-muted)"
              transform={`rotate(-45, ${LABEL_OFFSET + ci * CELL + CELL / 2}, ${LABEL_OFFSET - 6})`}
            >
              {col.length > 12 ? col.slice(0, 11) + "…" : col}
            </text>
          ))}

          {/* Row labels */}
          {columns.map((col, ri) => (
            <text
              key={`row-${ri}`}
              x={LABEL_OFFSET - 6}
              y={LABEL_OFFSET + ri * CELL + CELL / 2 + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--color-text-muted)"
            >
              {col.length > 12 ? col.slice(0, 11) + "…" : col}
            </text>
          ))}

          {/* Cells */}
          {matrix.map((row, ri) =>
            row.map((val, ci) => {
              const x = LABEL_OFFSET + ci * CELL;
              const y = LABEL_OFFSET + ri * CELL;
              return (
                <g key={`${ri}-${ci}`}>
                  <rect
                    x={x} y={y}
                    width={CELL} height={CELL}
                    fill={corrToRGB(val)}
                    stroke="var(--color-border)"
                    strokeWidth={0.5}
                    onMouseEnter={() =>
                      setTooltip({ row: columns[ri], col: columns[ci], value: val })
                    }
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: "crosshair" }}
                  />
                  <text
                    x={x + CELL / 2}
                    y={y + CELL / 2 + 4}
                    textAnchor="middle"
                    fontSize={10}
                    fill={textColor(val)}
                    pointerEvents="none"
                  >
                    {val.toFixed(2)}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Color scale legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        <span>−1.0</span>
        <div style={{
          flex: 1, height: 10, borderRadius: 5,
          background: "linear-gradient(to right, #FF0000, #FFFFFF, #0000B4)",
        }} />
        <span>+1.0</span>
      </div>
    </div>
  );
}
