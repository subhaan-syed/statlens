from typing import Any, Literal
from pydantic import BaseModel


ColumnDtype = Literal["numeric", "categorical", "datetime", "boolean"]


class ColumnInfo(BaseModel):
    name: str
    dtype: ColumnDtype
    null_pct: float
    unique_count: int


class UploadResponse(BaseModel):
    file_id: int
    filename: str
    row_count: int
    col_count: int
    preview: list[dict[str, Any]]
    columns: list[ColumnInfo]
