from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import eda, export, models, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="StatLens API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(eda.router, prefix="/api", tags=["eda"])
app.include_router(models.router, prefix="/api", tags=["models"])
app.include_router(export.router, prefix="/api", tags=["export"])


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
