import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { getHistograms, getFrequencies, getCorrelation, getNulls } from "../../api/eda";
import type { HistogramData, FrequencyData, CorrelationData, NullEntry } from "../../types";
import { Card } from "../layout/Card";
import { HistogramGrid } from "./HistogramGrid";
import { FrequencyGrid } from "./FrequencyGrid";
import { CorrelationHeatmap } from "./CorrelationHeatmap";
import { ScatterPlot } from "./ScatterPlot";
import { NullChart } from "./NullChart";

export function EDATab() {
  const { state } = useAppContext();
  const { fileId, columns } = state;

  const [histograms, setHistograms]   = useState<HistogramData[]>([]);
  const [frequencies, setFrequencies] = useState<FrequencyData[]>([]);
  const [correlation, setCorrelation] = useState<CorrelationData | null>(null);
  const [nulls, setNulls]             = useState<NullEntry[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!fileId) return;
    setLoading(true);
    Promise.all([
      getHistograms(fileId),
      getFrequencies(fileId),
      getCorrelation(fileId),
      getNulls(fileId),
    ])
      .then(([h, f, c, n]) => {
        setHistograms(h);
        setFrequencies(f);
        setCorrelation(c);
        setNulls(n);
      })
      .finally(() => setLoading(false));
  }, [fileId]);

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /> Profiling data…</div>;
  }

  return (
    <div className="section-grid">
      {/* Missing values */}
      <Card title="🕳️ Missing Values (% null per column)">
        <NullChart entries={nulls} />
      </Card>

      {/* Histograms */}
      <div>
        <h3 style={{ marginBottom: "var(--spacing-1)", fontSize: "1rem" }}>
          📈 Distributions (Numeric Columns)
        </h3>
        <HistogramGrid histograms={histograms} />
      </div>

      {/* Frequency charts */}
      <div>
        <h3 style={{ marginBottom: "var(--spacing-1)", fontSize: "1rem" }}>
          🏷️ Value Frequencies (Categorical Columns)
        </h3>
        <FrequencyGrid frequencies={frequencies} />
      </div>

      {/* Correlation heatmap */}
      <Card title="🔗 Pearson Correlation Heatmap">
        {correlation ? (
          <CorrelationHeatmap data={correlation} />
        ) : (
          <p style={{ color: "var(--color-text-muted)" }}>No numeric columns for correlation.</p>
        )}
      </Card>

      {/* Scatter plot */}
      {columns.filter((c) => c.dtype === "numeric").length >= 2 && (
        <Card title="🔍 Scatter Plot">
          <ScatterPlot fileId={fileId!} columns={columns} />
        </Card>
      )}
    </div>
  );
}
