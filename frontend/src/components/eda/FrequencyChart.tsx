import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import type { FrequencyData } from "../../types";

const COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444",
  "#06B6D4", "#F97316", "#EC4899", "#84CC16", "#6366F1",
];

interface Props {
  data: FrequencyData;
}

export function FrequencyChart({ data }: Props) {
  return (
    <div className="card">
      <div className="card-title" style={{ fontSize: "0.85rem" }}>
        📊 {data.column} — Top {data.values.length}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={Math.max(200, data.values.length * 28)}>
          <BarChart
            data={data.values}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.values.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
