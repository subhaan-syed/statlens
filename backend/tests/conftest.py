"""Shared pytest fixtures."""
from __future__ import annotations

import io
import os
import tempfile
from pathlib import Path

import pandas as pd
import numpy as np
import pytest
from fastapi.testclient import TestClient

# Point to a temp DB before importing the app
_tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp_db.close()
_tmp_upload = tempfile.mkdtemp()

os.environ["STATLENS_DATABASE_PATH"] = _tmp_db.name
os.environ["STATLENS_UPLOAD_DIR"] = _tmp_upload


def pytest_sessionfinish(session, exitstatus):
    try:
        os.unlink(_tmp_db.name)
    except Exception:
        pass


from app.database import init_db
from app.main import app

init_db(_tmp_db.name)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sample_df() -> pd.DataFrame:
    """200-row employee DataFrame matching sample_data.csv structure."""
    rng = np.random.default_rng(42)
    n = 200
    dept_choices = ["Engineering", "Marketing", "Sales", "HR", "Finance"]
    edu_choices = ["High School", "Bachelor", "Master", "PhD"]
    experience = rng.uniform(0.5, 30, n)
    salary = 40000 + experience * 3200 + rng.normal(0, 5000, n)

    df = pd.DataFrame({
        "employee_id": range(1, n + 1),
        "age": rng.integers(25, 57, n).astype(float),
        "years_experience": experience.round(1),
        "salary": salary.round(0),
        "department": rng.choice(dept_choices, n),
        "education_level": rng.choice(edu_choices, n),
        "hire_date": pd.date_range("2005-01-01", periods=n, freq="5D").strftime("%Y-%m-%d"),
        "is_remote": rng.choice([True, False], n),
        "performance_score": rng.uniform(2.5, 5.0, n).round(1),
    })
    # Inject some nulls
    null_idx_age = rng.integers(0, n, 10)
    null_idx_perf = rng.integers(0, n, 10)
    df.loc[null_idx_age, "age"] = np.nan
    df.loc[null_idx_perf, "performance_score"] = np.nan
    return df


@pytest.fixture
def sample_csv_bytes(sample_df) -> bytes:
    buf = io.BytesIO()
    sample_df.to_csv(buf, index=False)
    buf.seek(0)
    return buf.read()


@pytest.fixture
def real_sample_csv_bytes() -> bytes:
    """Read the real sample_data.csv file."""
    path = Path(__file__).parent.parent.parent / "sample_data.csv"
    return path.read_bytes()
