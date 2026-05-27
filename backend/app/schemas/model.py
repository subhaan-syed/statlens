from typing import Any, Literal
from pydantic import BaseModel, Field, model_validator


# ── Hyperparameter schemas ──────────────────────────────────────────────────

class RandomForestParams(BaseModel):
    n_estimators: int = Field(100, ge=10, le=500)
    max_depth: int = Field(10, ge=1, le=30)
    min_samples_split: int = Field(2, ge=2, le=20)


class GradientBoostingParams(BaseModel):
    n_estimators: int = Field(100, ge=10, le=300)
    learning_rate: float = Field(0.1, ge=0.01, le=1.0)
    max_depth: int = Field(3, ge=1, le=10)


class KNNParams(BaseModel):
    n_neighbors: int = Field(5, ge=1, le=30)
    weights: Literal["uniform", "distance"] = "uniform"


class LinearParams(BaseModel):
    C: float = Field(1.0, ge=0.001, le=100.0)
    max_iter: int = Field(200, ge=100, le=1000)


ModelType = Literal[
    "random_forest",
    "gradient_boosting",
    "knn",
    "linear_regression",
    "logistic_regression",
]

_PARAM_MAP: dict[str, type] = {
    "random_forest": RandomForestParams,
    "gradient_boosting": GradientBoostingParams,
    "knn": KNNParams,
    "linear_regression": LinearParams,
    "logistic_regression": LinearParams,
}


# ── Request / Response ──────────────────────────────────────────────────────

class TrainRequest(BaseModel):
    file_id: int
    target_column: str
    model_type: ModelType
    hyperparams: dict[str, Any] = {}

    @model_validator(mode="after")
    def validate_hyperparams(self) -> "TrainRequest":
        cls = _PARAM_MAP[self.model_type]
        # This will raise ValidationError if any field is out of range
        validated = cls(**self.hyperparams)
        self.hyperparams = validated.model_dump()
        return self


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class TrainResponse(BaseModel):
    experiment_id: int
    model_type: str
    task_type: Literal["regression", "classification"]
    score: float
    metric_name: str
    feature_importances: list[FeatureImportance]
    confusion_matrix: list[list[int]] | None = None
    confusion_labels: list[str] | None = None
    residuals: list[dict[str, float]] | None = None


class Experiment(BaseModel):
    id: int
    file_id: int
    model_type: str
    hyperparams_json: str
    score: float
    metric_name: str
    created_at: str
