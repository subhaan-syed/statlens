from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from app.database import get_db
from app.schemas.eda import CorrelationData, FrequencyData, HistogramData, NullEntry, ScatterData
from app.services.eda_service import (
    compute_correlation,
    compute_nulls,
    compute_scatter,
    get_frequencies,
    get_histograms,
)
from app.services.file_service import detect_column_types, parse_csv

router = APIRouter()


def _load_df(file_id: int) -> pd.DataFrame:
    with get_db() as db:
        row = db.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"File {file_id} not found.")
    return parse_csv(Path(row["file_path"]).read_bytes())


def _get_col_groups(df: pd.DataFrame) -> tuple[list[str], list[str]]:
    numeric_cols = list(df.select_dtypes(include="number").columns)
    object_cols = list(df.select_dtypes(include="object").columns)
    bool_cols = list(df.select_dtypes(include="bool").columns)
    categorical_cols = object_cols + bool_cols
    return numeric_cols, categorical_cols


@router.get("/eda/{file_id}/histograms", response_model=list[HistogramData])
def get_histograms_endpoint(file_id: int) -> list[HistogramData]:
    df = _load_df(file_id)
    numeric_cols, _ = _get_col_groups(df)
    return get_histograms(df, numeric_cols)


@router.get("/eda/{file_id}/frequencies", response_model=list[FrequencyData])
def get_frequencies_endpoint(file_id: int) -> list[FrequencyData]:
    df = _load_df(file_id)
    _, categorical_cols = _get_col_groups(df)
    return get_frequencies(df, categorical_cols)


@router.get("/eda/{file_id}/correlation", response_model=CorrelationData)
def get_correlation_endpoint(file_id: int) -> CorrelationData:
    df = _load_df(file_id)
    numeric_cols, _ = _get_col_groups(df)
    return compute_correlation(df, numeric_cols)


@router.get("/eda/{file_id}/scatter", response_model=ScatterData)
def get_scatter_endpoint(
    file_id: int,
    x_col: str = Query(...),
    y_col: str = Query(...),
) -> ScatterData:
    df = _load_df(file_id)
    if x_col not in df.columns or y_col not in df.columns:
        raise HTTPException(status_code=400, detail="Invalid column names.")
    return compute_scatter(df, x_col, y_col)


@router.get("/eda/{file_id}/nulls", response_model=list[NullEntry])
def get_nulls_endpoint(file_id: int) -> list[NullEntry]:
    df = _load_df(file_id)
    return compute_nulls(df)
