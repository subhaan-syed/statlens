"""Tests for file_service: column type detection and CSV parsing."""
import io

import numpy as np
import pandas as pd
import pytest

from app.services.file_service import detect_column_types, get_preview, parse_csv


# ── Column type detection ────────────────────────────────────────────────────

def test_detect_numeric_float_column():
    df = pd.DataFrame({"value": [1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9, 10.1,
                                  11.1, 12.2, 13.3, 14.4, 15.5]})
    cols = detect_column_types(df)
    assert cols[0].dtype == "numeric"


def test_detect_numeric_int_many_unique():
    # Int with many unique values → numeric
    df = pd.DataFrame({"salary": list(range(1000, 1200))})
    cols = detect_column_types(df)
    assert cols[0].dtype == "numeric"


def test_detect_categorical_from_low_cardinality_int():
    # Int with ≤10 unique values → categorical
    df = pd.DataFrame({"rating": [1, 2, 3, 4, 5, 1, 2, 3, 4, 5,
                                   1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2]})
    cols = detect_column_types(df)
    assert cols[0].dtype == "categorical"


def test_detect_categorical_from_string():
    df = pd.DataFrame({"department": ["Engineering", "Marketing", "Sales", "HR", "Finance"] * 10})
    cols = detect_column_types(df)
    assert cols[0].dtype == "categorical"


def test_detect_datetime_column():
    df = pd.DataFrame({"hire_date": ["2020-01-01", "2021-06-15", "2022-03-10",
                                      "2019-12-25", "2018-07-04"] * 10})
    cols = detect_column_types(df)
    assert cols[0].dtype == "datetime"


def test_detect_boolean_column():
    df = pd.DataFrame({"is_remote": [True, False, True, False, True] * 10})
    cols = detect_column_types(df)
    assert cols[0].dtype == "boolean"


def test_null_pct_calculation():
    df = pd.DataFrame({"age": [25.0, np.nan, 30.0, np.nan, 35.0, 40.0, np.nan, 45.0, 50.0, 55.0]})
    cols = detect_column_types(df)
    assert cols[0].null_pct == pytest.approx(30.0, abs=0.1)


def test_unique_count_calculation():
    df = pd.DataFrame({"dept": ["A", "B", "A", "C", "B"]})
    cols = detect_column_types(df)
    assert cols[0].unique_count == 3


def test_get_preview_returns_10_rows(sample_df):
    preview = get_preview(sample_df, n=10)
    assert len(preview) == 10


def test_parse_csv_returns_dataframe(sample_csv_bytes):
    df = parse_csv(sample_csv_bytes)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 200
