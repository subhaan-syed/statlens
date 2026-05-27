import type { ModelType } from "../../types";

const MODELS: { value: ModelType; label: string; desc: string }[] = [
  {
    value: "random_forest",
    label: "Random Forest",
    desc: "Ensemble of decision trees — robust, handles non-linear patterns well",
  },
  {
    value: "gradient_boosting",
    label: "Gradient Boosting",
    desc: "Sequential ensemble that corrects errors — often best accuracy",
  },
  {
    value: "knn",
    label: "K-Nearest Neighbors",
    desc: "Predicts based on similar training examples — intuitive but slower",
  },
  {
    value: "linear_regression",
    label: "Linear / Logistic Regression",
    desc: "Fast, interpretable baseline — great starting point",
  },
];

interface Props {
  value: ModelType;
  onChange: (m: ModelType) => void;
}

export function ModelSelector({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {MODELS.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          style={{
            padding: "10px 14px",
            border: `2px solid ${value === m.value ? "var(--color-primary)" : "var(--color-border)"}`,
            borderRadius: 8,
            background: value === m.value ? "var(--color-primary-dim)" : "var(--color-surface)",
            textAlign: "left",
            cursor: "pointer",
            transition: "border-color var(--transition), background var(--transition)",
          }}
          aria-pressed={value === m.value}
          data-model={m.value}
        >
          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.label}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: 2 }}>
            {m.desc}
          </div>
        </button>
      ))}
    </div>
  );
}
