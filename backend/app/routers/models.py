import json
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from app.database import get_db
from app.schemas.model import Experiment, TrainRequest, TrainResponse
from app.services.file_service import parse_csv
from app.services.model_service import train_model

router = APIRouter()


def _load_df(file_id: int) -> pd.DataFrame:
    with get_db() as db:
        row = db.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"File {file_id} not found.")
    return parse_csv(Path(row["file_path"]).read_bytes())


@router.post("/train", response_model=TrainResponse)
def train_endpoint(req: TrainRequest) -> TrainResponse:
    df = _load_df(req.file_id)

    if req.target_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{req.target_column}' not found.")

    result = train_model(df, req.target_column, req.model_type, req.hyperparams)

    # Persist experiment
    with get_db() as db:
        cursor = db.execute(
            "INSERT INTO experiments (file_id, model_type, hyperparams_json, score, metric_name) VALUES (?, ?, ?, ?, ?)",
            (
                req.file_id,
                req.model_type,
                json.dumps(req.hyperparams),
                result["score"],
                result["metric_name"],
            ),
        )
        exp_id = cursor.lastrowid

    return TrainResponse(
        experiment_id=exp_id,
        model_type=req.model_type,
        task_type=result["task_type"],
        score=result["score"],
        metric_name=result["metric_name"],
        feature_importances=result["feature_importances"],
        confusion_matrix=result["confusion_matrix"],
        confusion_labels=result["confusion_labels"],
        residuals=result["residuals"],
    )


@router.get("/experiments", response_model=list[Experiment])
def list_experiments(file_id: int = Query(...)) -> list[Experiment]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM experiments WHERE file_id = ? ORDER BY created_at DESC",
            (file_id,),
        ).fetchall()
    return [Experiment(**dict(row)) for row in rows]
