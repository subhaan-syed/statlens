# StatLens: ML Experimentation Toolkit

StatLens is an interactive machine learning platform that lets you upload a CSV, profile your data visually, train models with live hyperparameter tuning, compare experiments, and export a polished Excel report. Designed for rapid experimentation and streamlined ML workflow, it lets recruiters and hiring managers quickly see data science skills in action.

---

## Quick Start

### Prerequisites
- Python 3.11+ with [uv](https://docs.astral.sh/uv/) (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Node.js 18+ and npm

### 1. Clone and install

```bash
git clone https://github.com/subhaan-syed/statlens.git
cd statlens

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

- **API**: http://localhost:8000 (Swagger docs: http://localhost:8000/docs)
- **UI**: http://localhost:5173

### 3. Try it now

Upload the included `sample_data.csv` (200 synthetic employee records) to see every feature in action.

---

## Feature Walkthrough

### Step 1 Upload CSV

Drag and drop or click to select a CSV file (up to 100 MB). StatLens automatically detects column types:

| Type            | Detection Rule                                                |
|-----------------|--------------------------------------------------------------|
| **numeric**     | Float/int with many unique values                            |
| **categorical** | Strings, booleans, or low-cardinality integers               |
| **datetime**    | ISO date strings (at least 80% parseable)                    |
| **boolean**     | `True`/`False` columns                                       |

### Step 2 Configure Columns

After uploading, a configuration form shows all auto-detected types. You can override any type and must select a target column (what the model will predict). Inline validation prevents moving forward until configuration is valid.

### EDA Tab: Explore Data

Five automatically generated charts help data exploration:

| Chart               | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| **Histograms**      | Distribution of every numeric column. Bin count is calculated with Sturges' rule: `k = ⌈1 + log₂(n)⌉` |
| **Frequency bars**  | Top-10 most common values for every categorical column                      |
| **Correlation heatmap** | Pearson correlations between all numeric columns (-1 red to +1 blue)    |
| **Scatter plot**    | Interactive X/Y axis selectors for any two numeric columns                  |
| **Null chart**      | Percentage of missing values per column, sorted from worst to best          |

### Model Tab: Train and Tune

1. **Select a model.** StatLens picks regression or classification automatically based on your target column.
2. **Adjust hyperparameters** with sliders. Retraining only happens when you release the slider, so the UI stays responsive.
3. **Check the results.** You see a score card (R² for regression or accuracy for classification), a feature importance chart, a confusion matrix for classification, or a residuals plot for regression.

While training, previous results remain visible but dimmed. A latency badge shows how long the retrain took (green if under 2 seconds, amber for 2–5 seconds, red for more than 5 seconds).

### Experiment History Tab

Every training run is saved automatically. The table shows all previous experiments with their scores. The best run is highlighted in green. You can select any two runs and click Compare to see their hyperparameters and results side by side.

### Export Report

Click "Export Report" in the header or Model tab to download a formatted `.xlsx` file with four sheets:

| Sheet              | Contents                                                    |
|--------------------|------------------------------------------------------------|
| **Data Profile**   | Column stats: type, null percentage, min/max/mean/std, top value |
| **Correlations**   | Full Pearson matrix with color-coded cells                 |
| **Model Results**  | Best experiment's hyperparameters, score, feature importances |
| **Experiment History** | All runs for this file                                 |

---

## Model Types Explained

### Linear / Logistic Regression
The simplest model fits a straight line (for regression) or a decision boundary (for classification) through your data. It's fast to train, easy to explain, and a great baseline. Best for data where relationships are roughly linear.

- **Hyperparameter C:** Controls how strictly the model avoids overfitting. Higher C values are more flexible but risk memorizing the training data.

### Random Forest
Builds many decision trees on random subsets of your data, then averages their predictions. Handles non-linear patterns and messy data well, and automatically ranks feature importance.

- **n_estimators:** More trees create more stable predictions, but are slower.
- **max_depth:** Limits how deep each tree grows. Shallower trees generalize better.

### Gradient Boosting
Also based on decision trees, but builds them sequentially so each new tree corrects the mistakes of the previous one. Often achieves the highest accuracy of these options. Best for competitions and challenging datasets.

- **learning_rate:** Controls how much each new tree contributes. Lower values are safer but require more trees.

### K-Nearest Neighbors (KNN)
Makes predictions by looking at the k most similar training examples and averaging (for regression) or voting (for classification) on their outcomes. No explicit training step—it simply stores the data. Best for small datasets where simpler approaches work.

- **k (n_neighbors):** Fewer neighbors make the model more sensitive to local patterns; more neighbors produce smoother predictions.

---

## Running Tests

```bash
# Backend: 40 pytest tests
npm run test:backend

# Frontend: unit tests (Vitest + React Testing Library)
npm run test:frontend

# End-to-end (Playwright, requires both servers running)
npm run test:e2e

# Run backend and frontend tests together
npm run test:all
```

---

## Project Structure

```
statlens/
├── backend/           # FastAPI, scikit-learn, SQLite, openpyxl
│   ├── app/
│   │   ├── routers/   # upload, eda, models, export
│   │   ├── services/  # file_service, eda_service, model_service, export_service
│   │   └── schemas/   # Pydantic request/response models
│   └── tests/         # 40 pytest tests
├── frontend/          # React 18, TypeScript, Vite, Recharts
│   ├── src/
│   │   ├── components/  # upload, eda, models, experiments, layout
│   │   ├── context/     # AppContext (useReducer global state)
│   │   ├── api/         # typed axios wrappers
│   │   └── styles/      # CSS variables, global, responsive
│   ├── tests/           # Vitest + RTL unit tests
│   └── e2e/             # Playwright e2e test
├── sample_data.csv    # 200-row synthetic employee dataset
└── README.md
```

---

## Tech Stack

| Layer          | Technology                                               |
|----------------|---------------------------------------------------------|
| API server     | FastAPI, uvicorn                                        |
| Data           | pandas 3, NumPy                                         |
| ML             | scikit-learn (Ridge, LogisticRegression, RandomForest, GradientBoosting, KNN) |
| Database       | SQLite (stdlib sqlite3)                                 |
| Excel          | openpyxl                                                |
| Frontend       | React 18, TypeScript, Vite                              |
| Charts         | Recharts, custom SVG for heatmaps                       |
| HTTP client    | axios                                                   |
| Unit tests     | Vitest, React Testing Library, MSW                      |
| E2E tests      | Playwright                                              |
