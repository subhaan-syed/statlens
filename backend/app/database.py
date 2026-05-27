import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from app.config import settings

_CREATE_FILES = """
CREATE TABLE IF NOT EXISTS files (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    filename    TEXT NOT NULL,
    row_count   INTEGER NOT NULL,
    col_count   INTEGER NOT NULL,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    file_path   TEXT NOT NULL
);
"""

_CREATE_EXPERIMENTS = """
CREATE TABLE IF NOT EXISTS experiments (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id          INTEGER NOT NULL REFERENCES files(id),
    model_type       TEXT NOT NULL,
    hyperparams_json TEXT NOT NULL,
    score            REAL NOT NULL,
    metric_name      TEXT NOT NULL,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


def init_db(db_path: str | None = None) -> None:
    path = db_path or settings.database_path
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    try:
        conn.execute(_CREATE_FILES)
        conn.execute(_CREATE_EXPERIMENTS)
        conn.commit()
    finally:
        conn.close()


def get_connection(db_path: str | None = None) -> sqlite3.Connection:
    path = db_path or settings.database_path
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db(db_path: str | None = None) -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
