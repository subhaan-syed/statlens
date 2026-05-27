from __future__ import annotations

import json
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import accuracy_score, confusion_matrix, r2_score
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.schemas.model import FeatureImportance


# ── Task type detection ──────────────────────────────────────────────────────

def determine_task_type(series: pd.Series) -> str:
    """Return 'regression' if target is numeric with >10 unique values, else 'classification'."""
    if pd.api.types.is_float_dtype(series):
        return "regression" if series.nunique(dropna=True) > 10 else "classification"
    if pd.api.types.is_integer_dtype(series):
        return "regression" if series.nunique(dropna=True) > 10 else "classification"
    return "classification"


# ── Data preparation ─────────────────────────────────────────────────────────

def prepare_features(df: pd.DataFrame, target_col: str) -> tuple[pd.DataFrame, pd.Series, list[str], list[str]]:
    """Drop target, handle datetime cols, return X, y, numeric_cols, categorical_cols."""
    df = df.copy()

    # Drop rows where target is null
    df = df.dropna(subset=[target_col])

    y = df[target_col]
    X = df.drop(columns=[target_col])

    # Extract date parts from datetime columns; drop original
    for col in X.columns:
        if pd.api.types.is_datetime64_any_dtype(X[col]):
            X[f"{col}_year"] = X[col].dt.year
            X[f"{col}_month"] = X[col].dt.month
            X[f"{col}_day"] = X[col].dt.day
            X = X.drop(columns=[col])
        elif pd.api.types.is_object_dtype(X[col]) or pd.api.types.is_string_dtype(X[col]):
            # Try parse as datetime
            try:
                parsed = pd.to_datetime(X[col], format="mixed", errors="coerce")
                if parsed.notna().mean() >= 0.8:
                    X[f"{col}_year"] = parsed.dt.year
                    X[f"{col}_month"] = parsed.dt.month
                    X[f"{col}_day"] = parsed.dt.day
                    X = X.drop(columns=[col])
            except Exception:
                pass

    # Booleans → int
    bool_cols = X.select_dtypes(include="bool").columns
    X[bool_cols] = X[bool_cols].astype(int)

    numeric_cols = list(X.select_dtypes(include="number").columns)
    # pandas 3.0: string columns use 'str' dtype; also handle legacy 'object'
    categorical_cols = list(X.select_dtypes(include=["object", "str", "string"]).columns)

    return X, y, numeric_cols, categorical_cols


def build_pipeline(model_type: str, hyperparams: dict[str, Any], task_type: str, numeric_cols: list[str], categorical_cols: list[str]) -> Pipeline:
    transformers = []
    if numeric_cols:
        transformers.append(("num", StandardScaler(), numeric_cols))
    if categorical_cols:
        transformers.append(("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")

    estimator = _get_estimator(model_type, hyperparams, task_type)
    return Pipeline([("preprocessor", preprocessor), ("estimator", estimator)])


def _get_estimator(model_type: str, hyperparams: dict[str, Any], task_type: str):
    is_regression = task_type == "regression"

    if model_type == "random_forest":
        cls = RandomForestRegressor if is_regression else RandomForestClassifier
        return cls(
            n_estimators=hyperparams.get("n_estimators", 100),
            max_depth=hyperparams.get("max_depth", 10),
            min_samples_split=hyperparams.get("min_samples_split", 2),
            random_state=42,
        )

    if model_type == "gradient_boosting":
        cls = GradientBoostingRegressor if is_regression else GradientBoostingClassifier
        return cls(
            n_estimators=hyperparams.get("n_estimators", 100),
            learning_rate=hyperparams.get("learning_rate", 0.1),
            max_depth=hyperparams.get("max_depth", 3),
            random_state=42,
        )

    if model_type == "knn":
        cls = KNeighborsRegressor if is_regression else KNeighborsClassifier
        return cls(
            n_neighbors=hyperparams.get("n_neighbors", 5),
            weights=hyperparams.get("weights", "uniform"),
        )

    if model_type in ("linear_regression", "logistic_regression"):
        C = hyperparams.get("C", 1.0)
        max_iter = hyperparams.get("max_iter", 200)
        if is_regression:
            alpha = 1.0 / C if C > 0 else 1.0
            return Ridge(alpha=alpha)
        return LogisticRegression(C=C, max_iter=max_iter, random_state=42)

    raise ValueError(f"Unknown model type: {model_type}")


# ── Feature importance extraction ────────────────────────────────────────────

def extract_feature_importances(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    numeric_cols: list[str],
    categorical_cols: list[str],
    model_type: str,
    task_type: str,
) -> list[FeatureImportance]:
    estimator = pipeline.named_steps["estimator"]
    preprocessor = pipeline.named_steps["preprocessor"]

    # Reconstruct feature names after one-hot encoding
    feature_names = list(numeric_cols)
    if categorical_cols:
        ohe = preprocessor.named_transformers_.get("cat")
        if ohe is not None:
            feature_names += list(ohe.get_feature_names_out(categorical_cols))

    if hasattr(estimator, "feature_importances_"):
        importances = estimator.feature_importances_
    elif hasattr(estimator, "coef_"):
        coef = estimator.coef_
        if coef.ndim > 1:
            coef = np.abs(coef).mean(axis=0)
        importances = np.abs(coef)
        total = importances.sum()
        if total > 0:
            importances = importances / total
    else:
        # KNN: use permutation importance
        X_transformed = preprocessor.transform(X_test)
        scoring = "r2" if task_type == "regression" else "accuracy"
        perm = permutation_importance(estimator, X_transformed, y_test, n_repeats=5, random_state=42, scoring=scoring)
        importances = np.abs(perm.importances_mean)
        total = importances.sum()
        if total > 0:
            importances = importances / total

    # Align lengths (OHE may produce more features than names if there's a mismatch)
    n = min(len(feature_names), len(importances))
    pairs = sorted(
        zip(feature_names[:n], importances[:n]),
        key=lambda x: x[1],
        reverse=True,
    )
    return [FeatureImportance(feature=f, importance=round(float(v), 6)) for f, v in pairs]


# ── Main training entry point ────────────────────────────────────────────────

def train_model(
    df: pd.DataFrame,
    target_col: str,
    model_type: str,
    hyperparams: dict[str, Any],
) -> dict[str, Any]:
    task_type = determine_task_type(df[target_col])

    X, y, numeric_cols, categorical_cols = prepare_features(df, target_col)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipeline = build_pipeline(model_type, hyperparams, task_type, numeric_cols, categorical_cols)
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)

    if task_type == "regression":
        score = float(r2_score(y_test, y_pred))
        metric_name = "r2"
    else:
        score = float(accuracy_score(y_test, y_pred))
        metric_name = "accuracy"

    feature_importances = extract_feature_importances(
        pipeline, X_test, y_test, numeric_cols, categorical_cols, model_type, task_type
    )

    result: dict[str, Any] = {
        "task_type": task_type,
        "score": round(score, 6),
        "metric_name": metric_name,
        "feature_importances": feature_importances,
        "confusion_matrix": None,
        "confusion_labels": None,
        "residuals": None,
    }

    if task_type == "classification":
        labels = sorted([str(c) for c in y.unique()])
        cm = confusion_matrix(y_test.astype(str), [str(p) for p in y_pred], labels=labels)
        result["confusion_matrix"] = cm.tolist()
        result["confusion_labels"] = labels
    else:
        result["residuals"] = [
            {"predicted": float(p), "actual": float(a)}
            for p, a in zip(y_pred[:200], y_test.values[:200])
        ]

    return result
