import { useState, useEffect, useCallback } from "react";
import {
  MODEL_HYPERPARAM_DEFS,
  isSlider,
  type ModelType,
} from "../../types";

interface Props {
  modelType: ModelType;
  onCommit: (params: Record<string, number | string>) => void;
}

function buildDisplayDefaults(modelType: ModelType): Record<string, number | string> {
  const defs = MODEL_HYPERPARAM_DEFS[modelType];
  const result: Record<string, number | string> = {};
  for (const d of defs) {
    result[d.key] = d.defaultValue; // slider shows log10(C) for log-scale params
  }
  return result;
}

function buildCommitValues(
  displayVals: Record<string, number | string>,
  modelType: ModelType
): Record<string, number | string> {
  const defs = MODEL_HYPERPARAM_DEFS[modelType];
  const result: Record<string, number | string> = {};
  for (const d of defs) {
    if (isSlider(d) && d.logScale) {
      result[d.key] = parseFloat(Math.pow(10, Number(displayVals[d.key])).toFixed(6));
    } else {
      result[d.key] = displayVals[d.key];
    }
  }
  return result;
}

export function HyperparamPanel({ modelType, onCommit }: Props) {
  const [displayValues, setDisplayValues] = useState<Record<string, number | string>>(
    () => buildDisplayDefaults(modelType)
  );

  // Reset when model type changes
  useEffect(() => {
    const defaults = buildDisplayDefaults(modelType);
    setDisplayValues(defaults);
    onCommit(buildCommitValues(defaults, modelType));
  }, [modelType]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback(
    (newDisplayVals: Record<string, number | string>) => {
      onCommit(buildCommitValues(newDisplayVals, modelType));
    },
    [modelType, onCommit]
  );

  const handleMouseUp = (key: string, value: number | string) => {
    const updated = { ...displayValues, [key]: value };
    setDisplayValues(updated);
    commit(updated);
  };

  const defs = MODEL_HYPERPARAM_DEFS[modelType];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)" }}>
      {defs.map((def) => {
        if (isSlider(def)) {
          const rawVal = Number(displayValues[def.key] ?? def.defaultValue);
          const displayLabel = def.logScale
            ? `${Math.pow(10, rawVal).toFixed(3)}`
            : `${rawVal}`;

          return (
            <div key={def.key} className="slider-row">
              <div className="slider-label-row">
                <span>{def.label}</span>
                <span>{displayLabel}</span>
              </div>
              <input
                type="range"
                min={def.min}
                max={def.max}
                step={def.step}
                value={rawVal}
                aria-label={def.label}
                data-param={def.key}
                onChange={(e) => {
                  // Update display immediately on drag
                  setDisplayValues((prev) => ({ ...prev, [def.key]: +e.target.value }));
                }}
                onMouseUp={(e) => handleMouseUp(def.key, +e.currentTarget.value)}
                onTouchEnd={(e) => {
                  const v = +e.currentTarget.value;
                  handleMouseUp(def.key, v);
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                <span>{def.logScale ? `10^${def.min}` : def.min}</span>
                <span>{def.logScale ? `10^${def.max}` : def.max}</span>
              </div>
            </div>
          );
        } else {
          // Toggle (e.g. KNN weights)
          const currentVal = String(displayValues[def.key] ?? def.defaultValue);
          return (
            <div key={def.key} className="form-group">
              <label className="form-label">{def.label}</label>
              <div style={{ display: "flex", gap: "6px" }}>
                {def.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      const updated = { ...displayValues, [def.key]: opt };
                      setDisplayValues(updated);
                      commit(updated);
                    }}
                    style={{
                      flex: 1,
                      padding: "6px",
                      border: `2px solid ${currentVal === opt ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: currentVal === opt ? "var(--color-primary-dim)" : "var(--color-surface)",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: currentVal === opt ? 700 : 400,
                    }}
                    aria-pressed={currentVal === opt}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}
