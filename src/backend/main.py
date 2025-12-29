"""
FastAPI backend for Pipeline Leakage Detection System
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import auth, chat, detection
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application
    """
    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Initialize database with default data
    init_db()

    yield

    # Cleanup (if needed)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Pipeline Leakage Detection System API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(detection.router, prefix="/api/detection", tags=["detection"])


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy"}
