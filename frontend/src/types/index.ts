// ── Column / File types ─────────────────────────────────────────────────────

export type ColumnDtype = "numeric" | "categorical" | "datetime" | "boolean";

export interface ColumnInfo {
  name: string;
  dtype: ColumnDtype;
  null_pct: number;
  unique_count: number;
}

export interface UploadResponse {
  file_id: number;
  filename: string;
  row_count: number;
  col_count: number;
  preview: Record<string, unknown>[];
  columns: ColumnInfo[];
}

// ── EDA types ───────────────────────────────────────────────────────────────

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
}

export interface HistogramData {
  column: string;
  bins: HistogramBin[];
}

export interface FrequencyValue {
  label: string;
  count: number;
}

export interface FrequencyData {
  column: string;
  values: FrequencyValue[];
}

export interface CorrelationData {
  columns: string[];
  matrix: number[][];
}

export interface ScatterPoint {
  x: number;
  y: number;
}

export interface ScatterData {
  x_col: string;
  y_col: string;
  points: ScatterPoint[];
}

export interface NullEntry {
  column: string;
  null_pct: number;
}

// ── Model types ─────────────────────────────────────────────────────────────

export type ModelType =
  | "random_forest"
  | "gradient_boosting"
  | "knn"
  | "linear_regression"
  | "logistic_regression";

export type TaskType = "regression" | "classification";

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface TrainRequest {
  file_id: number;
  target_column: string;
  model_type: ModelType;
  hyperparams: Record<string, number | string>;
}

export interface TrainResponse {
  experiment_id: number;
  model_type: string;
  task_type: TaskType;
  score: number;
  metric_name: string;
  feature_importances: FeatureImportance[];
  confusion_matrix: number[][] | null;
  confusion_labels: string[] | null;
  residuals: { predicted: number; actual: number }[] | null;
}

export interface Experiment {
  id: number;
  file_id: number;
  model_type: string;
  hyperparams_json: string;
  score: number;
  metric_name: string;
  created_at: string;
}

// ── Hyperparameter definitions ──────────────────────────────────────────────

export interface SliderParam {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  logScale?: boolean;
}

export interface ToggleParam {
  key: string;
  label: string;
  options: string[];
  defaultValue: string;
}

export type HyperparamDef = SliderParam | ToggleParam;

export function isSlider(p: HyperparamDef): p is SliderParam {
  return "min" in p;
}

export const MODEL_HYPERPARAM_DEFS: Record<ModelType, HyperparamDef[]> = {
  random_forest: [
    { key: "n_estimators", label: "Trees (n_estimators)", min: 10, max: 500, step: 10, defaultValue: 100 },
    { key: "max_depth", label: "Max Depth", min: 1, max: 30, step: 1, defaultValue: 10 },
    { key: "min_samples_split", label: "Min Samples Split", min: 2, max: 20, step: 1, defaultValue: 2 },
  ],
  gradient_boosting: [
    { key: "n_estimators", label: "Boosting Rounds", min: 10, max: 300, step: 10, defaultValue: 100 },
    { key: "learning_rate", label: "Learning Rate", min: 0.01, max: 1.0, step: 0.01, defaultValue: 0.1 },
    { key: "max_depth", label: "Max Depth", min: 1, max: 10, step: 1, defaultValue: 3 },
  ],
  knn: [
    { key: "n_neighbors", label: "Neighbors (k)", min: 1, max: 30, step: 1, defaultValue: 5 },
    { key: "weights", label: "Weight Function", options: ["uniform", "distance"], defaultValue: "uniform" },
  ],
  linear_regression: [
    { key: "C", label: "Regularisation (C)", min: -3, max: 2, step: 0.1, defaultValue: 0, logScale: true },
    { key: "max_iter", label: "Max Iterations", min: 100, max: 1000, step: 50, defaultValue: 200 },
  ],
  logistic_regression: [
    { key: "C", label: "Regularisation (C)", min: -3, max: 2, step: 0.1, defaultValue: 0, logScale: true },
    { key: "max_iter", label: "Max Iterations", min: 100, max: 1000, step: 50, defaultValue: 200 },
  ],
};

export function getDefaultHyperparams(modelType: ModelType): Record<string, number | string> {
  const defs = MODEL_HYPERPARAM_DEFS[modelType];
  const result: Record<string, number | string> = {};
  for (const d of defs) {
    if (isSlider(d)) {
      result[d.key] = d.logScale ? Math.pow(10, d.defaultValue) : d.defaultValue;
    } else {
      result[d.key] = d.defaultValue;
    }
  }
  return result;
}
