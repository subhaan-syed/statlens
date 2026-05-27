# StatLens: ML Experimentation Toolkit

An interactive machine learning platform that lets you upload a CSV, profile your data visually, train models with live hyperparameter tuning, compare experiments, and export a polished Excel report — all in one browser tab.

---

## Quick Start

### Prerequisites
- Python 3.11+ with [uv](https://docs.astral.sh/uv/) (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Node.js 18+ and npm

### 1. Clone and install

```bash
git clone <repo-url>
cd stat-lens

# Install backend
cd backend && uv sync && cd ..

# Install frontend
cd frontend && npm install && cd ..
```

### 2. Run (both servers at once)

```bash
npm install        # installs concurrently
npm run dev
```

- **API**: http://localhost:8000 · Swagger docs: http://localhost:8000/docs
- **UI**: http://localhost:5173

### 3. Try it now

Upload the included `sample_data.csv` (200 synthetic employee records) to see every feature in action.

---

## Feature Walkthrough

### Step 1 Upload CSV

Drag-and-drop or click to select a CSV file (up to 100 MB). StatLens auto-detects column types:

| Type | Detection Rule |
|------|---------------|
| **numeric** | float/int with many unique values |
| **categorical** | strings, booleans, or low-cardinality integers |
| **datetime** | ISO date strings (≥80% parseable) |
| **boolean** | `True`/`False` columns |

> **Screenshot placeholder**: *Upload zone with drag-and-drop*

### Step 2 Configure Columns

After upload, a configuration form shows all auto-detected types. You can override any type and must select a **target column** (what the model will predict). Inline validation prevents you from proceeding with invalid settings.

> **Screenshot placeholder**: *Column configuration form with target selector*

### EDA Tab: Explore Data

Five automatically generated charts:

| Chart | Description |
|-------|-------------|
| **Histograms** | Distribution of every numeric column. Bin count calculated with Sturges' rule: `k = ⌈1 + log₂(n)⌉` |
| **Frequency bars** | Top-10 most common values for every categorical column |
| **Correlation heatmap** | Pearson correlations between all numeric columns (-1 red → +1 blue) |
| **Scatter plot** | Interactive X/Y axis selectors for any two numeric columns |
| **Null chart** | % missing values per column, sorted from worst to best |

> **Screenshot placeholder**: *EDA tab showing histograms and correlation heatmap*

### Model Tab: Train & Tune

1. **Select a model** (StatLens picks regression or classification automatically based on your target column)
2. **Adjust hyperparameters** with sliders, retraining fires only when you release the slider, keeping the UI responsive
3. **Read the results**, score card (R² or accuracy), feature importance chart, confusion matrix (classification) or residuals plot (regression)

When a retrain starts, your previous results stay visible but dimmed. A latency badge shows how long the retrain took (green < 2 s, amber 2–5 s, red > 5 s).

> **Screenshot placeholder**: *Model tab with score card and feature importance chart*

### Experiment History Tab

Every training run is saved automatically. The table shows all past experiments with their scores. The best run is highlighted in green. Select any two runs and click **Compare** to see their hyperparameters side-by-side in a modal.

> **Screenshot placeholder**: *Experiment history table with compare modal*

### Export Report

Click **Export Report** (header or Model tab) to download a formatted `.xlsx` file with four sheets:

| Sheet | Contents |
|-------|---------|
| **Data Profile** | Column stats type, null%, min/max/mean/std, top value |
| **Correlations** | Full Pearson matrix with color-coded cells |
| **Model Results** | Best experiment's hyperparams, score, feature importances |
| **Experiment History** | All runs for this file |

---

## Model Types Explained (Plain English)

### Linear / Logistic Regression
The simplest model draws a straight line (or decision boundary) through your data. Fast to train, easy to explain, and a great baseline. **Best for**: data where relationships are roughly linear.

**Hyperparameter C**: Controls how strictly the model avoids overfitting. Higher C = more flexible but risks memorising the training data.

### Random Forest
Builds hundreds of decision trees on random subsets of your data, then averages their predictions. Handles non-linear patterns and messy real-world data well, and automatically ranks feature importance. **Best for**: general-purpose prediction with tabular data.

**n_estimators**: More trees = more stable predictions (but slower). **max_depth**: How deep each tree grows shallower trees generalise better.

### Gradient Boosting
Also uses decision trees, but builds them *sequentially* each tree corrects the mistakes of the previous one. Often the highest accuracy of the four options. **Best for**: competitions and situations where maximum accuracy matters.

**learning_rate**: How much each new tree contributes. Smaller = safer but needs more trees.

### K-Nearest Neighbors (KNN)
Predicts by looking at the *k* most similar training examples and averaging (or voting on) their outcomes. No explicit training step — it just remembers the data. **Best for**: small datasets where similar inputs should give similar outputs.

**k (n_neighbors)**: Fewer neighbours = more sensitive to local patterns; more neighbours = smoother predictions.

---

## Running Tests

```bash
# Backend — 40 pytest tests
npm run test:backend

# Frontend — unit tests (Vitest + React Testing Library)
npm run test:frontend

# End-to-end (Playwright — requires both servers running)
npm run test:e2e

# Run backend + frontend tests together
npm run test:all
```

---

## Project Structure

```
stat-lens/
├── backend/           # FastAPI · scikit-learn · SQLite · openpyxl
│   ├── app/
│   │   ├── routers/   # upload, eda, models, export
│   │   ├── services/  # file_service, eda_service, model_service, export_service
│   │   └── schemas/   # Pydantic request/response models
│   └── tests/         # 40 pytest tests
├── frontend/          # React 18 · TypeScript · Vite · Recharts
│   ├── src/
│   │   ├── components/# upload, eda, models, experiments, layout
│   │   ├── context/   # AppContext (useReducer global state)
│   │   ├── api/       # typed axios wrappers
│   │   └── styles/    # CSS variables, global, responsive
│   ├── tests/         # Vitest + RTL unit tests
│   └── e2e/           # Playwright e2e test
├── sample_data.csv    # 200-row synthetic employee dataset
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API server | FastAPI + uvicorn |
| Data | pandas 3, NumPy |
| ML | scikit-learn (Ridge, LogisticRegression, RandomForest, GradientBoosting, KNN) |
| Database | SQLite (stdlib sqlite3) |
| Excel | openpyxl |
| Frontend | React 18 + TypeScript + Vite |
| Charts | Recharts (+ custom SVG for heatmaps) |
| HTTP client | axios |
| Unit tests | Vitest + React Testing Library + MSW |
| E2E tests | Playwright |
