"""Tests for export_service: Excel workbook generation."""
import io
import sqlite3
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from openpyxl import load_workbook

from app.database import init_db
from app.services.export_service import build_workbook
from app.services.file_service import detect_column_types


EXPECTED_SHEETS = ["Data Profile", "Correlations", "Model Results", "Experiment History"]


def _make_test_db_with_file(df: pd.DataFrame) -> tuple[sqlite3.Connection, int]:
    """Create an in-memory DB with a file entry and return (conn, file_id)."""
    # Write df to a temp CSV
    tmp = tempfile.NamedTemporaryFile(suffix=".csv", delete=False)
    df.to_csv(tmp.name, index=False)
    tmp.close()

    db_path = tempfile.mktemp(suffix=".db")
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    cursor = conn.execute(
        "INSERT INTO files (filename, row_count, col_count, file_path) VALUES (?, ?, ?, ?)",
        ("test.csv", len(df), len(df.columns), tmp.name),
    )
    conn.commit()
    file_id = cursor.lastrowid
    return conn, file_id


def _make_sample_df(n=50) -> pd.DataFrame:
    rng = np.random.default_rng(0)
    experience = rng.uniform(1, 20, n)
    salary = 40000 + experience * 3000 + rng.normal(0, 3000, n)
    return pd.DataFrame({
        "age": rng.integers(25, 55, n).astype(float),
        "years_experience": experience,
        "salary": salary,
        "department": rng.choice(["Engineering", "Sales", "HR"], n),
    })


def test_excel_sheet_names():
    df = _make_sample_df()
    conn, file_id = _make_test_db_with_file(df)
    try:
        xlsx_bytes = build_workbook(file_id, conn)
        wb = load_workbook(io.BytesIO(xlsx_bytes))
        assert wb.sheetnames == EXPECTED_SHEETS
    finally:
        conn.close()


def test_data_profile_row_count():
    df = _make_sample_df()
    conn, file_id = _make_test_db_with_file(df)
    try:
        xlsx_bytes = build_workbook(file_id, conn)
        wb = load_workbook(io.BytesIO(xlsx_bytes))
        ws = wb["Data Profile"]
        # 1 header row + 1 row per column
        assert ws.max_row == 1 + len(df.columns)
    finally:
        conn.close()


def test_bold_headers():
    df = _make_sample_df()
    conn, file_id = _make_test_db_with_file(df)
    try:
        xlsx_bytes = build_workbook(file_id, conn)
        wb = load_workbook(io.BytesIO(xlsx_bytes))
        for sheet_name in EXPECTED_SHEETS:
            ws = wb[sheet_name]
            for cell in ws[1]:
                if cell.value is not None:
                    assert cell.font.bold, f"Header cell {cell.coordinate} in '{sheet_name}' is not bold"
    finally:
        conn.close()


def test_experiment_history_sheet_with_data():
    df = _make_sample_df()
    conn, file_id = _make_test_db_with_file(df)
    import json
    conn.execute(
        "INSERT INTO experiments (file_id, model_type, hyperparams_json, score, metric_name) VALUES (?, ?, ?, ?, ?)",
        (file_id, "random_forest", json.dumps({"n_estimators": 100}), 0.85, "r2"),
    )
    conn.commit()
    try:
        xlsx_bytes = build_workbook(file_id, conn)
        wb = load_workbook(io.BytesIO(xlsx_bytes))
        ws = wb["Experiment History"]
        # 1 header + 1 data row
        assert ws.max_row == 2
    finally:
        conn.close()
