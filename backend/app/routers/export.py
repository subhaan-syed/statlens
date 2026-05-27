from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.database import get_db
from app.services.export_service import build_workbook

router = APIRouter()

XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get("/export/{file_id}")
def export_report(file_id: int) -> Response:
    with get_db() as db:
        try:
            xlsx_bytes = build_workbook(file_id, db)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    return Response(
        content=xlsx_bytes,
        media_type=XLSX_MIME,
        headers={"Content-Disposition": f"attachment; filename=\"statlens_report_{file_id}.xlsx\""},
    )
