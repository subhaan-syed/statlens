import type { HistogramData } from "../../types";
import { HistogramChart } from "./HistogramChart";

interface Props {
  histograms: HistogramData[];
}

export function HistogramGrid({ histograms }: Props) {
  if (histograms.length === 0) {
    return <p style={{ color: "var(--color-text-muted)" }}>No numeric columns found.</p>;
  }

  return (
    <div className="chart-grid">
      {histograms.map((h) => (
        <HistogramChart key={h.column} data={h} />
      ))}
    </div>
  );
}
