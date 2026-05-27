import type { FrequencyData } from "../../types";
import { FrequencyChart } from "./FrequencyChart";

interface Props {
  frequencies: FrequencyData[];
}

export function FrequencyGrid({ frequencies }: Props) {
  if (frequencies.length === 0) {
    return <p style={{ color: "var(--color-text-muted)" }}>No categorical columns found.</p>;
  }

  return (
    <div className="chart-grid">
      {frequencies.map((f) => (
        <FrequencyChart key={f.column} data={f} />
      ))}
    </div>
  );
}
