import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

interface Residual {
  predicted: number;
  actual: number;
}

interface Props {
  residuals: Residual[];
}

export function ResidualsChart({ residuals }: Props) {
  const data = residuals.map((r) => ({
    predicted: r.predicted,
    residual: r.actual - r.predicted,
  }));

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="predicted"
            name="Predicted"
            type="number"
            tick={{ fontSize: 11 }}
            label={{ value: "Predicted", position: "insideBottom", offset: -10, fontSize: 12 }}
          />
          <YAxis
            dataKey="residual"
            name="Residual"
            type="number"
            tick={{ fontSize: 11 }}
            label={{ value: "Residual", angle: -90, position: "insideLeft", fontSize: 12 }}
          />
          <Tooltip formatter={(v: number) => [v.toFixed(2)]} />
          <ReferenceLine y={0} stroke="var(--color-danger)" strokeDasharray="4 4" strokeWidth={1.5} />
          <Scatter data={data} fill="var(--color-primary)" fillOpacity={0.5} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
