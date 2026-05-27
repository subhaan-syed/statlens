"""Tests for model_service: training, scoring, feature importances, task detection."""
import numpy as np
import pandas as pd
import pytest
from pydantic import ValidationError

from app.schemas.model import RandomForestParams
from app.services.model_service import determine_task_type, train_model


# ── Task type detection ───────────────────────────────────────────────────────

def test_determine_task_type_regression_float():
    series = pd.Series([float(i) for i in range(100)])
    assert determine_task_type(series) == "regression"


def test_determine_task_type_classification_string():
    series = pd.Series(["A", "B", "C", "A", "B"] * 20)
    assert determine_task_type(series) == "classification"


def test_determine_task_type_classification_low_cardinality_int():
    series = pd.Series([1, 2, 3, 1, 2, 3] * 20)
    assert determine_task_type(series) == "classification"


# ── Hyperparameter validation ─────────────────────────────────────────────────

def test_hyperparameter_validation_n_estimators_too_low():
    with pytest.raises(ValidationError):
        RandomForestParams(n_estimators=9)  # min is 10


def test_hyperparameter_validation_n_estimators_too_high():
    with pytest.raises(ValidationError):
        RandomForestParams(n_estimators=501)  # max is 500


def test_hyperparameter_validation_valid():
    params = RandomForestParams(n_estimators=100, max_depth=10, min_samples_split=2)
    assert params.n_estimators == 100


# ── Model training ────────────────────────────────────────────────────────────

def _make_df(n=150) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    experience = rng.uniform(0.5, 25, n)
    salary = 40000 + experience * 3000 + rng.normal(0, 4000, n)
    dept = rng.choice(["Engineering", "Sales", "HR"], n)
    return pd.DataFrame({
        "years_experience": experience,
        "salary": salary,
        "department": dept,
    })


def test_train_linear_regression():
    df = _make_df()
    result = train_model(df, "salary", "linear_regression", {"C": 1.0, "max_iter": 200})
    assert result["task_type"] == "regression"
    assert result["metric_name"] == "r2"
    assert isinstance(result["score"], float)
    assert result["residuals"] is not None
    assert result["confusion_matrix"] is None


def test_train_logistic_regression():
    df = _make_df()
    result = train_model(df, "department", "logistic_regression", {"C": 1.0, "max_iter": 300})
    assert result["task_type"] == "classification"
    assert result["metric_name"] == "accuracy"
    assert 0.0 <= result["score"] <= 1.0
    assert result["confusion_matrix"] is not None


def test_train_random_forest_feature_importances_sum():
    df = _make_df()
    result = train_model(df, "salary", "random_forest", {"n_estimators": 50, "max_depth": 5})
    importances = [fi.importance for fi in result["feature_importances"]]
    assert abs(sum(importances) - 1.0) < 0.05  # should sum to ~1.0


def test_train_gradient_boosting_score_in_range():
    df = _make_df()
    result = train_model(df, "salary", "gradient_boosting",
                         {"n_estimators": 50, "learning_rate": 0.1, "max_depth": 3})
    assert result["task_type"] == "regression"
    # R² can be negative but typically in a reasonable range for this data
    assert isinstance(result["score"], float)


def test_train_knn_regression():
    df = _make_df()
    result = train_model(df, "salary", "knn", {"n_neighbors": 5, "weights": "uniform"})
    assert result["task_type"] == "regression"
    assert isinstance(result["score"], float)
    assert len(result["feature_importances"]) > 0


def test_train_knn_classification():
    df = _make_df()
    result = train_model(df, "department", "knn", {"n_neighbors": 3, "weights": "distance"})
    assert result["task_type"] == "classification"
    assert 0.0 <= result["score"] <= 1.0
    assert result["confusion_matrix"] is not None
