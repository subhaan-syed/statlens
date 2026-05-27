from __future__ import annotations

import io
import json
import sqlite3
from pathlib import Path
from typing import Any

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from app.services.eda_service import compute_correlation, compute_nulls
from app.services.file_service import detect_column_types, parse_csv


# ── Color helpers ────────────────────────────────────────────────────────────

def _corr_color(value: float) -> str:
    """Map correlation [-1, 1] to red–white–blue hex."""
    v = max(-1.0, min(1.0, value))
    if v < 0:
        # Negative: interpolate from red (FF0000) to white (FFFFFF)
        t = v + 1  # 0..1
        r = 255
        g = int(t * 255)
        b = int(t * 255)
    else:
        # Positive: interpolate from white to blue (4575b4)
        t = v  # 0..1
        r = int((1 - t) * 255)
        g = int((1 - t) * 255)
        b = int((1 - t) * 255 + t * 180)
    return f"{r:02X}{g:02X}{b:02X}"


def _alt_fill(row_idx: int) -> PatternFill | None:
    if row_idx % 2 == 0:
        return PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
    return None


BOLD_FONT = Font(bold=True)
HEADER_FILL = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")


def _write_header(ws, headers: list[str]) -> None:
    for col_idx, h in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=h)
        cell.font = BOLD_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(horizontal="center")


def _autofit(ws) -> None:
    for col_cells in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col_cells[0].column)
        for cell in col_cells:
            try:
                if cell.value:
                    max_len = max(max_len, len(str(cell.value)))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = max(10, max_len + 4)


# ── Sheet builders ───────────────────────────────────────────────────────────

def _build_data_profile(ws, df: pd.DataFrame) -> None:
    headers = ["Column", "Type", "Count", "Null%", "Min", "Max", "Mean", "Std", "Top Value", "Top Freq"]
    _write_header(ws, headers)

    cols_info = detect_column_types(df)
    null_pcts = {e.column: e.null_pct for e in compute_nulls(df)}

    for row_idx, ci in enumerate(cols_info, start=2):
        series = df[ci.name]
        fill = _alt_fill(row_idx)
        vals: list[Any] = [ci.name, ci.dtype, int(series.notna().sum()), ci.null_pct]

        if ci.dtype == "numeric":
            num = series.dropna().astype(float)
            vals += [
                round(float(num.min()), 4) if len(num) else None,
                round(float(num.max()), 4) if len(num) else None,
                round(float(num.mean()), 4) if len(num) else None,
                round(float(num.std()), 4) if len(num) else None,
                None, None,
            ]
        else:
            vc = series.value_counts()
            top_val = str(vc.index[0]) if len(vc) else None
            top_freq = int(vc.iloc[0]) if len(vc) else None
            vals += [None, None, None, None, top_val, top_freq]

        for col_idx, v in enumerate(vals, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=v)
            if fill:
                cell.fill = fill

    _autofit(ws)


def _build_correlations(ws, df: pd.DataFrame) -> None:
    numeric_cols = list(df.select_dtypes(include="number").columns)
    corr_data = compute_correlation(df, numeric_cols)

    # Header row: blank + col names
    ws.cell(row=1, column=1, value="").font = BOLD_FONT
    for ci, col in enumerate(corr_data.columns, start=2):
        cell = ws.cell(row=1, column=ci, value=col)
        cell.font = BOLD_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(horizontal="center")

    for ri, (row_label, row_vals) in enumerate(zip(corr_data.columns, corr_data.matrix), start=2):
        label_cell = ws.cell(row=ri, column=1, value=row_label)
        label_cell.font = BOLD_FONT
        for ci, val in enumerate(row_vals, start=2):
            cell = ws.cell(row=ri, column=ci, value=round(val, 4))
            hex_color = _corr_color(val)
            cell.fill = PatternFill(start_color=hex_color, end_color=hex_color, fill_type="solid")
            cell.alignment = Alignment(horizontal="center")

    _autofit(ws)


def _build_model_results(ws, experiments: list[sqlite3.Row], df: pd.DataFrame) -> None:
    if not experiments:
        cell = ws.cell(row=1, column=1, value="No experiments yet.")
        cell.font = BOLD_FONT
        return

    # Find best experiment
    best = max(experiments, key=lambda e: e["score"])

    headers = ["Key", "Value"]
    _write_header(ws, headers)
    rows = [
        ("Model Type", best["model_type"]),
        ("Score", round(best["score"], 6)),
        ("Metric", best["metric_name"]),
        ("Trained At", best["created_at"]),
    ]

    try:
        params = json.loads(best["hyperparams_json"])
        for k, v in params.items():
            rows.append((f"Param: {k}", v))
    except Exception:
        pass

    for row_idx, (k, v) in enumerate(rows, start=2):
        fill = _alt_fill(row_idx)
        cell_k = ws.cell(row=row_idx, column=1, value=k)
        cell_v = ws.cell(row=row_idx, column=2, value=v)
        if fill:
            cell_k.fill = fill
            cell_v.fill = fill

    _autofit(ws)


def _build_experiment_history(ws, experiments: list[sqlite3.Row]) -> None:
    headers = ["ID", "Model Type", "Score", "Metric", "Hyperparams", "Created At"]
    _write_header(ws, headers)

    for row_idx, exp in enumerate(experiments, start=2):
        fill = _alt_fill(row_idx)
        row_vals = [
            exp["id"],
            exp["model_type"],
            round(exp["score"], 6),
            exp["metric_name"],
            exp["hyperparams_json"],
            exp["created_at"],
        ]
        for col_idx, v in enumerate(row_vals, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=v)
            if fill:
                cell.fill = fill

    _autofit(ws)


# ── Public entry point ───────────────────────────────────────────────────────

def build_workbook(file_id: int, db: sqlite3.Connection) -> bytes:
    # Load file record
    row = db.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
    if row is None:
        raise ValueError(f"File {file_id} not found")

    df = parse_csv(Path(row["file_path"]).read_bytes())

    # Load experiments
    experiments = db.execute(
        "SELECT * FROM experiments WHERE file_id = ? ORDER BY created_at DESC",
        (file_id,),
    ).fetchall()

    wb = Workbook()

    ws1 = wb.active
    ws1.title = "Data Profile"
    _build_data_profile(ws1, df)

    ws2 = wb.create_sheet("Correlations")
    _build_correlations(ws2, df)

    ws3 = wb.create_sheet("Model Results")
    _build_model_results(ws3, experiments, df)

    ws4 = wb.create_sheet("Experiment History")
    _build_experiment_history(ws4, experiments)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()
