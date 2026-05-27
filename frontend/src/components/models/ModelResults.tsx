import type { TrainResponse } from "../../types";
import { Card } from "../layout/Card";
import { FeatureImportanceChart } from "./FeatureImportanceChart";
import { ConfusionMatrix } from "./ConfusionMatrix";
import { ResidualsChart } from "./ResidualsChart";
import { LatencyBadge } from "./TrainingStatus";

interface Props {
  result: TrainResponse;
  dimmed: boolean;
  latencyMs: number | null;
}

export function ModelResults({ result, dimmed, latencyMs }: Props) {
  const metricLabel = result.metric_name === "r2" ? "R²" : "Accuracy";
  const pct = result.metric_name === "accuracy"
    ? `${(result.score * 100).toFixed(1)}%`
    : result.score.toFixed(4);

  return (
    <div className={`section-grid ${dimmed ? "dimmed" : ""}`} style={{ transition: "opacity 0.2s" }}>
      {/* Score */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--spacing-1)" }}>
          <div style={{ fontWeight: 600, color: "var(--color-text-muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {metricLabel} Score
          </div>
          <LatencyBadge latencyMs={latencyMs} />
        </div>
        <div className="score-card__value" data-testid="score-value">
          {pct}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>
          {result.task_type} · {result.model_type.replace(/_/g, " ")}
        </div>
      </Card>

      {/* Feature importances */}
      <Card title="🏆 Feature Importances">
        <FeatureImportanceChart importances={result.feature_importances} />
      </Card>

      {/* Classification only */}
      {result.task_type === "classification" && result.confusion_matrix && result.confusion_labels && (
        <Card title="🔲 Confusion Matrix">
          <ConfusionMatrix matrix={result.confusion_matrix} labels={result.confusion_labels} />
        </Card>
      )}

      {/* Regression only */}
      {result.task_type === "regression" && result.residuals && (
        <Card title="📉 Residuals Plot">
          <ResidualsChart residuals={result.residuals} />
        </Card>
      )}
    </div>
  );
}
