"""Main FastAPI application for SOP Generator"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Support both package and script execution
try:  # When imported as a package (recommended)
    from .routes.sop import router as sop_router
except Exception:
    # When executed as a top-level script, construct package imports explicitly
    import os
    import sys
    import importlib

    _pkg_dir = os.path.dirname(os.path.abspath(__file__))  # .../app/SOP_Generator
    _parent_dir = os.path.dirname(_pkg_dir)  # .../app
    if _parent_dir not in sys.path:
        sys.path.insert(0, _parent_dir)

    _sop_module = importlib.import_module("SOP_Generator.routes.sop")
    sop_router = _sop_module.router

app = FastAPI(
    title="SOP Generator API",
    description="AI-powered Statement of Purpose generator",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sop_router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "SOP Generator",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": "2025-11-17T00:00:00Z"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
