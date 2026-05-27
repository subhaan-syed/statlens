import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import type { NullEntry } from "../../types";

interface Props {
  entries: NullEntry[];
}

export function NullChart({ entries }: Props) {
  const sorted = [...entries].sort((a, b) => b.null_pct - a.null_pct);
  const hasNulls = sorted.some((e) => e.null_pct > 0);

  if (!hasNulls) {
    return (
      <div style={{ padding: "var(--spacing-2)", color: "var(--color-success)", fontWeight: 600 }}>
        ✅ No missing values in this dataset!
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={Math.max(220, sorted.length * 28)}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="column"
            width={130}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "Null %"]} />
          <ReferenceLine x={0} stroke="var(--color-border)" />
          <Bar dataKey="null_pct" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.null_pct > 20 ? "var(--color-danger)" : entry.null_pct > 5 ? "var(--color-warning)" : "var(--color-primary)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
