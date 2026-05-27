"""Tests for EDA service: histograms, correlation, nulls, frequencies."""
import math

import numpy as np
import pandas as pd
import pytest

from app.services.eda_service import (
    compute_correlation,
    compute_histogram,
    compute_nulls,
    compute_scatter,
    compute_frequencies,
    sturges_bins,
)


# ── Sturges' rule ─────────────────────────────────────────────────────────────

def test_sturges_bins_200_rows():
    """n=200 → k = ceil(1 + log2(200)) = ceil(8.64) = 9."""
    assert sturges_bins(200) == 9


def test_sturges_bins_8_rows():
    """n=8 → k = ceil(1 + log2(8)) = ceil(4) = 4."""
    assert sturges_bins(8) == 4


def test_sturges_bins_1_row():
    assert sturges_bins(1) == 1


# ── Histograms ────────────────────────────────────────────────────────────────

def test_histogram_bin_count_matches_sturges():
    series = pd.Series(range(200), dtype=float)
    result = compute_histogram(series, "test")
    assert len(result.bins) == sturges_bins(200)


def test_histogram_counts_sum_to_n():
    series = pd.Series(range(100), dtype=float)
    result = compute_histogram(series, "test")
    assert sum(b.count for b in result.bins) == 100


def test_histogram_ignores_nulls():
    series = pd.Series([1.0, 2.0, np.nan, 4.0, 5.0, np.nan] * 10)
    non_null = series.dropna()
    result = compute_histogram(series, "test")
    assert sum(b.count for b in result.bins) == len(non_null)


# ── Null percentages ──────────────────────────────────────────────────────────

def test_null_percentage_known_count():
    df = pd.DataFrame({
        "a": [1.0, np.nan, np.nan, 4.0, 5.0],  # 40% null
        "b": [1.0, 2.0, 3.0, 4.0, 5.0],         # 0% null
    })
    nulls = compute_nulls(df)
    null_map = {e.column: e.null_pct for e in nulls}
    assert null_map["a"] == pytest.approx(40.0, abs=0.01)
    assert null_map["b"] == pytest.approx(0.0, abs=0.01)


def test_nulls_sorted_descending():
    df = pd.DataFrame({
        "high": [np.nan] * 30 + [1.0] * 70,
        "low": [np.nan] * 10 + [1.0] * 90,
        "zero": [1.0] * 100,
    })
    nulls = compute_nulls(df)
    pcts = [e.null_pct for e in nulls]
    assert pcts == sorted(pcts, reverse=True)


# ── Pearson correlation ───────────────────────────────────────────────────────

def test_pearson_correlation_perfect():
    """Two identical columns → correlation = 1.0."""
    x = list(range(50))
    df = pd.DataFrame({"a": x, "b": x})
    result = compute_correlation(df, ["a", "b"])
    # diagonal entries
    assert result.matrix[0][0] == pytest.approx(1.0, abs=0.001)
    assert result.matrix[1][1] == pytest.approx(1.0, abs=0.001)
    # off-diagonal entries
    assert result.matrix[0][1] == pytest.approx(1.0, abs=0.001)


def test_pearson_correlation_independent():
    """Uncorrelated random columns → |corr| should be low."""
    rng = np.random.default_rng(0)
    df = pd.DataFrame({"a": rng.normal(size=500), "b": rng.normal(size=500)})
    result = compute_correlation(df, ["a", "b"])
    assert abs(result.matrix[0][1]) < 0.15


def test_pearson_correlation_negative():
    x = list(range(50))
    df = pd.DataFrame({"a": x, "b": list(reversed(x))})
    result = compute_correlation(df, ["a", "b"])
    assert result.matrix[0][1] == pytest.approx(-1.0, abs=0.001)


# ── Frequencies ───────────────────────────────────────────────────────────────

def test_top_value_frequencies_top_n():
    series = pd.Series(["A"] * 50 + ["B"] * 30 + ["C"] * 20 + ["D"] * 5 + ["E"] * 2 +
                       ["F"] * 1 + ["G"] * 1 + ["H"] * 1 + ["I"] * 1 + ["J"] * 1 +
                       ["K"] * 1 + ["L"] * 1)
    result = compute_frequencies(series, "dept", top_n=10)
    assert len(result.values) == 10
    # Highest frequency first
    assert result.values[0].label == "A"
    assert result.values[0].count == 50


def test_scatter_returns_correct_columns():
    df = pd.DataFrame({"x": range(50), "y": range(50, 100)})
    result = compute_scatter(df, "x", "y")
    assert result.x_col == "x"
    assert result.y_col == "y"
    assert len(result.points) == 50


def test_scatter_samples_when_large():
    df = pd.DataFrame({"x": range(2000), "y": range(2000)})
    result = compute_scatter(df, "x", "y", max_points=1000)
    assert len(result.points) == 1000
