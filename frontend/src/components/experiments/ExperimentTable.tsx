import type { Experiment } from "../../types";

interface Props {
  experiments: Experiment[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}

function formatParams(json: string): string {
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    return Object.entries(obj)
      .slice(0, 3)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
  } catch {
    return json;
  }
}

export function ExperimentTable({ experiments, selectedIds, onToggle }: Props) {
  if (experiments.length === 0) {
    return (
      <p style={{ color: "var(--color-text-muted)", padding: "var(--spacing-2)" }}>
        No experiments yet. Train a model on the Model tab to see results here.
      </p>
    );
  }

  const bestScore = Math.max(...experiments.map((e) => e.score));

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}></th>
            <th>Model</th>
            <th>Hyperparams</th>
            <th>Score</th>
            <th>Metric</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => {
            const isBest = exp.score === bestScore;
            const isSelected = selectedIds.has(exp.id);
            const rowClass = isBest
              ? "best-run"
              : isSelected
              ? "selected-row"
              : "";

            return (
              <tr key={exp.id} className={rowClass} data-experiment-id={exp.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(exp.id)}
                    aria-label={`Select experiment ${exp.id}`}
                    disabled={!isSelected && selectedIds.size >= 2}
                  />
                </td>
                <td>
                  {isBest && <span title="Best run">🏆 </span>}
                  {exp.model_type.replace(/_/g, " ")}
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                  {formatParams(exp.hyperparams_json)}
                </td>
                <td style={{ fontWeight: 700 }}>
                  {exp.metric_name === "r2"
                    ? exp.score.toFixed(4)
                    : `${(exp.score * 100).toFixed(1)}%`}
                </td>
                <td>{exp.metric_name}</td>
                <td style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  {exp.created_at.slice(0, 19).replace("T", " ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
