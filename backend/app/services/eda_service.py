from __future__ import annotations

import math

import numpy as np
import pandas as pd

from app.schemas.eda import (
    CorrelationData,
    FrequencyData,
    FrequencyValue,
    HistogramBin,
    HistogramData,
    NullEntry,
    ScatterData,
    ScatterPoint,
)


# ── Histograms ───────────────────────────────────────────────────────────────

def sturges_bins(n: int) -> int:
    """Sturges' rule: k = ceil(1 + log2(n))."""
    if n <= 1:
        return 1
    return int(math.ceil(1 + math.log2(n)))


def compute_histogram(series: pd.Series, col_name: str) -> HistogramData:
    clean = series.dropna().astype(float)
    n = len(clean)
    k = sturges_bins(n) if n > 0 else 1
    counts, edges = np.histogram(clean, bins=k)
    bins = [
        HistogramBin(x0=float(edges[i]), x1=float(edges[i + 1]), count=int(counts[i]))
        for i in range(len(counts))
    ]
    return HistogramData(column=col_name, bins=bins)


def get_histograms(df: pd.DataFrame, numeric_cols: list[str]) -> list[HistogramData]:
    return [compute_histogram(df[col], col) for col in numeric_cols]


# ── Frequencies ──────────────────────────────────────────────────────────────

def compute_frequencies(series: pd.Series, col_name: str, top_n: int = 10) -> FrequencyData:
    counts = series.dropna().astype(str).value_counts().head(top_n)
    values = [FrequencyValue(label=str(label), count=int(cnt)) for label, cnt in counts.items()]
    return FrequencyData(column=col_name, values=values)


def get_frequencies(df: pd.DataFrame, categorical_cols: list[str]) -> list[FrequencyData]:
    return [compute_frequencies(df[col], col) for col in categorical_cols]


# ── Correlation ──────────────────────────────────────────────────────────────

def compute_correlation(df: pd.DataFrame, numeric_cols: list[str]) -> CorrelationData:
    if len(numeric_cols) < 2:
        cols = numeric_cols or []
        return CorrelationData(columns=cols, matrix=[[1.0]] if cols else [])
    sub = df[numeric_cols].select_dtypes(include="number")
    corr = sub.corr(method="pearson").fillna(0)
    columns = list(corr.columns)
    matrix = [[round(float(v), 4) for v in row] for row in corr.values]
    return CorrelationData(columns=columns, matrix=matrix)


# ── Scatter ──────────────────────────────────────────────────────────────────

def compute_scatter(
    df: pd.DataFrame, x_col: str, y_col: str, max_points: int = 1000
) -> ScatterData:
    sub = df[[x_col, y_col]].dropna().astype(float)
    if len(sub) > max_points:
        sub = sub.sample(n=max_points, random_state=42)
    points = [ScatterPoint(x=float(r[x_col]), y=float(r[y_col])) for _, r in sub.iterrows()]
    return ScatterData(x_col=x_col, y_col=y_col, points=points)


# ── Nulls ────────────────────────────────────────────────────────────────────

def compute_nulls(df: pd.DataFrame) -> list[NullEntry]:
    total = len(df)
    if total == 0:
        return []
    pcts = (df.isnull().sum() / total * 100).sort_values(ascending=False)
    return [NullEntry(column=str(col), null_pct=round(float(pct), 2)) for col, pct in pcts.items()]
