from __future__ import annotations

import io
from typing import Any

import numpy as np
import pandas as pd

from app.schemas.file import ColumnDtype, ColumnInfo


# ── Column type detection ────────────────────────────────────────────────────

def detect_column_types(df: pd.DataFrame) -> list[ColumnInfo]:
    result: list[ColumnInfo] = []
    for col in df.columns:
        series = df[col]
        dtype = _infer_dtype(series)
        null_pct = float(series.isna().sum() / len(series) * 100) if len(series) > 0 else 0.0
        unique_count = int(series.nunique(dropna=True))
        result.append(ColumnInfo(name=col, dtype=dtype, null_pct=round(null_pct, 2), unique_count=unique_count))
    return result


def _infer_dtype(series: pd.Series) -> ColumnDtype:
    # Already a boolean dtype
    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    # Already datetime
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"

    # Numeric
    if pd.api.types.is_float_dtype(series):
        return "numeric"

    if pd.api.types.is_integer_dtype(series):
        n_unique = series.nunique(dropna=True)
        total = len(series.dropna())
        # Low-cardinality int (≤10 unique values and enough rows) → categorical
        if n_unique <= 10 and total > 20:
            return "categorical"
        return "numeric"

    # String/object columns: try to parse as datetime
    # pandas 3.0 changed string dtype from 'object' to 'str'
    is_string_col = (
        pd.api.types.is_object_dtype(series)
        or pd.api.types.is_string_dtype(series)
    )
    if is_string_col:
        non_null = series.dropna()
        if len(non_null) == 0:
            return "categorical"
        # Sample up to 50 values to check parsability
        sample = non_null.head(50)
        try:
            parsed = pd.to_datetime(sample, format="mixed", errors="coerce")
            success_rate = parsed.notna().sum() / len(sample)
            if success_rate >= 0.8:
                return "datetime"
        except Exception:
            try:
                parsed = pd.to_datetime(sample, errors="coerce")
                success_rate = parsed.notna().sum() / len(sample)
                if success_rate >= 0.8:
                    return "datetime"
            except Exception:
                pass
        return "categorical"

    return "categorical"


# ── CSV parsing ──────────────────────────────────────────────────────────────

def parse_csv(contents: bytes) -> pd.DataFrame:
    return pd.read_csv(io.BytesIO(contents))


def get_preview(df: pd.DataFrame, n: int = 10) -> list[dict[str, Any]]:
    preview_df = df.head(n).copy()
    # Convert non-serialisable types
    for col in preview_df.columns:
        if pd.api.types.is_datetime64_any_dtype(preview_df[col]):
            preview_df[col] = preview_df[col].astype(str)
        elif pd.api.types.is_bool_dtype(preview_df[col]):
            preview_df[col] = preview_df[col].astype(str)
    return preview_df.where(pd.notnull(preview_df), None).to_dict(orient="records")
