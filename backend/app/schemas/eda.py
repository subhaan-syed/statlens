from pydantic import BaseModel


class HistogramBin(BaseModel):
    x0: float
    x1: float
    count: int


class HistogramData(BaseModel):
    column: str
    bins: list[HistogramBin]


class FrequencyValue(BaseModel):
    label: str
    count: int


class FrequencyData(BaseModel):
    column: str
    values: list[FrequencyValue]


class CorrelationData(BaseModel):
    columns: list[str]
    matrix: list[list[float]]


class ScatterPoint(BaseModel):
    x: float
    y: float


class ScatterData(BaseModel):
    x_col: str
    y_col: str
    points: list[ScatterPoint]


class NullEntry(BaseModel):
    column: str
    null_pct: float
