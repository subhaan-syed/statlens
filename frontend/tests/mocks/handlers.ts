import { http, HttpResponse, delay } from "msw";

// ── Shared fixtures ────────────────────────────────────────────────────────

export const MOCK_COLUMNS = [
  { name: "age",              dtype: "numeric",     null_pct: 5.0,  unique_count: 30 },
  { name: "years_experience", dtype: "numeric",     null_pct: 0.0,  unique_count: 50 },
  { name: "salary",           dtype: "numeric",     null_pct: 0.0,  unique_count: 200 },
  { name: "department",       dtype: "categorical", null_pct: 0.0,  unique_count: 5  },
  { name: "education_level",  dtype: "categorical", null_pct: 0.0,  unique_count: 4  },
  { name: "hire_date",        dtype: "datetime",    null_pct: 0.0,  unique_count: 200 },
  { name: "is_remote",        dtype: "boolean",     null_pct: 0.0,  unique_count: 2  },
  { name: "performance_score",dtype: "numeric",     null_pct: 5.0,  unique_count: 30 },
];

export const MOCK_UPLOAD_RESPONSE = {
  file_id: 1,
  filename: "sample_data.csv",
  row_count: 200,
  col_count: 8,
  preview: Array.from({ length: 10 }, (_, i) => ({
    age: 30 + i,
    years_experience: 5 + i,
    salary: 60000 + i * 1000,
    department: "Engineering",
    education_level: "Bachelor",
    hire_date: "2020-01-01",
    is_remote: true,
    performance_score: 3.5,
  })),
  columns: MOCK_COLUMNS,
};

export const MOCK_TRAIN_RESPONSE = {
  experiment_id: 1,
  model_type: "random_forest",
  task_type: "regression",
  score: 0.89,
  metric_name: "r2",
  feature_importances: [
    { feature: "years_experience", importance: 0.55 },
    { feature: "age",              importance: 0.25 },
    { feature: "performance_score",importance: 0.20 },
  ],
  confusion_matrix: null,
  confusion_labels: null,
  residuals: [{ predicted: 72000, actual: 75000 }],
};

export const MOCK_EXPERIMENTS = [
  {
    id: 1, file_id: 1, model_type: "random_forest",
    hyperparams_json: JSON.stringify({ n_estimators: 100, max_depth: 10, min_samples_split: 2 }),
    score: 0.89, metric_name: "r2", created_at: "2024-01-01 10:00:00",
  },
  {
    id: 2, file_id: 1, model_type: "gradient_boosting",
    hyperparams_json: JSON.stringify({ n_estimators: 50, learning_rate: 0.1, max_depth: 3 }),
    score: 0.76, metric_name: "r2", created_at: "2024-01-01 10:05:00",
  },
  {
    id: 3, file_id: 1, model_type: "knn",
    hyperparams_json: JSON.stringify({ n_neighbors: 5, weights: "uniform" }),
    score: 0.65, metric_name: "r2", created_at: "2024-01-01 10:10:00",
  },
];

export const MOCK_HISTOGRAMS = [
  { column: "age",               bins: [{ x0: 25, x1: 30, count: 40 }, { x0: 30, x1: 35, count: 60 }] },
  { column: "years_experience",  bins: [{ x0: 0,  x1: 5,  count: 30 }, { x0: 5,  x1: 10, count: 80 }] },
  { column: "salary",            bins: [{ x0: 40000, x1: 60000, count: 50 }] },
];

export const MOCK_NULLS = [
  { column: "age",               null_pct: 5.0 },
  { column: "performance_score", null_pct: 5.0 },
  { column: "salary",            null_pct: 0.0 },
];

// ── Handlers ───────────────────────────────────────────────────────────────

export const handlers = [
  http.post("/api/upload", () =>
    HttpResponse.json(MOCK_UPLOAD_RESPONSE)
  ),

  http.get("/api/eda/:fileId/histograms", () =>
    HttpResponse.json(MOCK_HISTOGRAMS)
  ),

  http.get("/api/eda/:fileId/frequencies", () =>
    HttpResponse.json([
      { column: "department",      values: [{ label: "Engineering", count: 80 }, { label: "Sales", count: 40 }] },
      { column: "education_level", values: [{ label: "Bachelor", count: 100 }, { label: "Master", count: 60 }] },
    ])
  ),

  http.get("/api/eda/:fileId/correlation", () =>
    HttpResponse.json({
      columns: ["age", "years_experience", "salary"],
      matrix: [[1.0, 0.82, 0.75], [0.82, 1.0, 0.90], [0.75, 0.90, 1.0]],
    })
  ),

  http.get("/api/eda/:fileId/scatter", () =>
    HttpResponse.json({
      x_col: "age",
      y_col: "salary",
      points: Array.from({ length: 50 }, (_, i) => ({ x: 25 + i * 0.5, y: 40000 + i * 1000 })),
    })
  ),

  http.get("/api/eda/:fileId/nulls", () =>
    HttpResponse.json(MOCK_NULLS)
  ),

  http.post("/api/train", () =>
    HttpResponse.json(MOCK_TRAIN_RESPONSE)
  ),

  http.get("/api/experiments", () =>
    HttpResponse.json(MOCK_EXPERIMENTS)
  ),

  http.get("/api/export/:fileId", () =>
    new HttpResponse(new Blob(["fake xlsx"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=statlens_report_1.xlsx",
      },
    })
  ),
];

/** Variant: delayed train response (for optimistic UI tests) */
export const delayedTrainHandler = http.post("/api/train", async () => {
  await delay(200);
  return HttpResponse.json(MOCK_TRAIN_RESPONSE);
});
