import type { Experiment } from "../../types";

interface Props {
  expA: Experiment;
  expB: Experiment;
  onClose: () => void;
}

function formatParams(json: string): Record<string, unknown> {
  try { return JSON.parse(json); } catch { return {}; }
}

function ParamColumn({ exp }: { exp: Experiment }) {
  const params = formatParams(exp.hyperparams_json);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontWeight: 700, fontSize: "1rem" }}>
        {exp.model_type.replace(/_/g, " ")}
      </div>
      <div style={{
        fontSize: "1.5rem", fontWeight: 800,
        color: "var(--color-primary)",
      }}>
        {exp.metric_name === "r2"
          ? exp.score.toFixed(4)
          : `${(exp.score * 100).toFixed(1)}%`}
        <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 4 }}>
          {exp.metric_name}
        </span>
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        {exp.created_at.slice(0, 19).replace("T", " ")}
      </div>
      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
        <div className="form-label" style={{ marginBottom: "6px" }}>Hyperparameters</div>
        <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
          <tbody>
            {Object.entries(params).map(([k, v]) => (
              <tr key={k} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "4px 6px", color: "var(--color-text-muted)", fontWeight: 500 }}>{k}</td>
                <td style={{ padding: "4px 6px", fontWeight: 600 }}>{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CompareModal({ expA, expB, onClose }: Props) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Compare experiments"
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">🔍 Compare Experiments</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div
          className="compare-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-2)" }}
        >
          <div className="card" style={{ borderColor: "var(--color-primary)" }}>
            <ParamColumn exp={expA} />
          </div>
          <div className="card">
            <ParamColumn exp={expB} />
          </div>
        </div>

        {/* Score diff */}
        <div style={{ marginTop: "var(--spacing-2)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Score difference:{" "}
          <strong style={{ color: Math.abs(expA.score - expB.score) > 0.01 ? "var(--color-primary)" : "var(--color-text-muted)" }}>
            {Math.abs(expA.score - expB.score).toFixed(4)}
          </strong>
          {expA.score > expB.score
            ? " — left is better"
            : expB.score > expA.score
            ? " — right is better"
            : " — tied"}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--spacing-2)" }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
