import { useState, useEffect } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getScatter } from "../../api/eda";
import type { ColumnInfo, ScatterData } from "../../types";

interface Props {
  fileId: number;
  columns: ColumnInfo[];
}

export function ScatterPlot({ fileId, columns }: Props) {
  const numericCols = columns.filter((c) => c.dtype === "numeric").map((c) => c.name);

  const [xCol, setXCol] = useState<string>(numericCols[0] ?? "");
  const [yCol, setYCol] = useState<string>(numericCols[1] ?? numericCols[0] ?? "");
  const [data, setData] = useState<ScatterData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!xCol || !yCol) return;
    setLoading(true);
    getScatter(fileId, xCol, yCol)
      .then(setData)
      .finally(() => setLoading(false));
  }, [fileId, xCol, yCol]);

  return (
    <div>
      <div style={{ display: "flex", gap: "var(--spacing-1)", marginBottom: "var(--spacing-1)", flexWrap: "wrap" }}>
        <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
          <label className="form-label" htmlFor="scatter-x">X Axis</label>
          <select
            id="scatter-x"
            className="form-select"
            value={xCol}
            onChange={(e) => setXCol(e.target.value)}
          >
            {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
          <label className="form-label" htmlFor="scatter-y">Y Axis</label>
          <select
            id="scatter-y"
            className="form-select"
            value={yCol}
            onChange={(e) => setYCol(e.target.value)}
          >
            {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="loading-overlay"><div className="spinner" /> Loading scatter…</div>}

      {!loading && data && (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="x"
                name={data.x_col}
                type="number"
                label={{ value: data.x_col, position: "insideBottom", offset: -4, fontSize: 12 }}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                dataKey="y"
                name={data.y_col}
                type="number"
                label={{ value: data.y_col, angle: -90, position: "insideLeft", fontSize: 12 }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                data={data.points}
                fill="var(--color-primary)"
                fillOpacity={0.55}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
