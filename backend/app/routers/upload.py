import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from app.config import settings
from app.database import get_db
from app.schemas.file import UploadResponse
from app.services.file_service import detect_column_types, get_preview, parse_csv

router = APIRouter()

MAX_BYTES = settings.max_file_size_mb * 1024 * 1024


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile) -> UploadResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size of {settings.max_file_size_mb}MB.",
        )

    # Parse
    try:
        df = parse_csv(contents)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {exc}") from exc

    # Save to disk
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
    file_path = upload_dir / safe_name
    file_path.write_bytes(contents)

    # Detect types
    columns = detect_column_types(df)

    # Persist metadata
    with get_db() as db:
        cursor = db.execute(
            "INSERT INTO files (filename, row_count, col_count, file_path) VALUES (?, ?, ?, ?)",
            (file.filename, len(df), len(df.columns), str(file_path)),
        )
        file_id = cursor.lastrowid

    preview = get_preview(df, n=10)

    return UploadResponse(
        file_id=file_id,
        filename=file.filename,
        row_count=len(df),
        col_count=len(df.columns),
        preview=preview,
        columns=columns,
    )
