import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import type { FeatureImportance } from "../../types";

interface Props {
  importances: FeatureImportance[];
}

const COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444",
  "#06B6D4", "#F97316", "#EC4899", "#84CC16", "#6366F1",
];

export function FeatureImportanceChart({ importances }: Props) {
  const top = [...importances].sort((a, b) => b.importance - a.importance).slice(0, 15);

  if (top.length === 0) return null;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={Math.max(200, top.length * 28)}>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => v.toFixed(3)}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={130}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            formatter={(v: number) => [v.toFixed(4), "Importance"]}
          />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {top.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
