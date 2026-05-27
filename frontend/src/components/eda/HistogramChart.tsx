import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HistogramData } from "../../types";

interface Props {
  data: HistogramData;
}

export function HistogramChart({ data }: Props) {
  const chartData = data.bins.map((b) => ({
    label: `${b.x0.toFixed(1)}–${b.x1.toFixed(1)}`,
    count: b.count,
    x0: b.x0,
  }));

  return (
    <div className="card">
      <div className="card-title" style={{ fontSize: "0.85rem" }}>
        📊 {data.column}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="x0"
              tickFormatter={(v: number) => v.toFixed(0)}
              tick={{ fontSize: 11 }}
              label={{ value: data.column, position: "insideBottom", offset: -10, fontSize: 11 }}
            />
            <YAxis tick={{ fontSize: 11 }} width={36} />
            <Tooltip
              formatter={(_: unknown, __: unknown, props: { payload?: { label?: string } }) => [
                props.payload?.label ?? "",
                "Count",
              ]}
              labelFormatter={(v: number) => `Bin start: ${Number(v).toFixed(2)}`}
            />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
