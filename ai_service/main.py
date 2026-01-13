"""
EduLen AI Service - Main FastAPI Application
Provides vector stores, tracking agents, and study abroad automation
"""

# Load environment variables FIRST before any imports
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.chroma_client import chroma_manager
from app.api.v1 import vector_store, resume, cv, sop, tracker, research, agents, documents, embeddings, ocr, search, query, health, faculty, sop_analysis, admission, gradcafe_collection, model_training, sop_generator, sop_templates, sop_upload, roadmap, files, analyzer, dream_chat, smart_profile, journey
from app.SOP_Generator.routes import sop as sop_gen_routes
from app.api.v2 import multi_agent
from app.api import documents_processing
from app.memory.mongodb_memory import MongoDBMemoryManager
from app.database.mongodb import connect_to_mongodb, close_mongodb_connection, create_indexes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting EduLen AI Service...")

    # Initialize ChromaDB on startup
    if settings.ENABLE_CHROMA:
        try:
            chroma_manager.initialize()
            logger.info("ChromaDB initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise
    else:
        logger.warning("ChromaDB initialization disabled (ENABLE_CHROMA=false)")

    # Initialize MongoDB for document operations
    if settings.ENABLE_MONGODB:
        try:
            await connect_to_mongodb()
            await create_indexes()
            logger.info("MongoDB initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB: {e}")
            raise
    else:
        logger.warning("MongoDB initialization disabled (ENABLE_MONGODB=false)")

    # Load admission prediction model
    if settings.ENABLE_ADMISSION_MODEL_LOAD:
        try:
            from app.services.admission_prediction_service import admission_service
            logger.info("Loading admission prediction model...")
            await admission_service.load_latest_model()
            if admission_service.model_metadata:
                logger.info(
                    f"Admission model loaded: {admission_service.model_metadata.version} "
                    f"(accuracy: {admission_service.model_metadata.accuracy:.3f})"
                )
            else:
                logger.info("No trained admission model found, using heuristic predictions")
        except Exception as e:
            logger.error(f"Failed to initialize admission service: {e}")
            logger.warning("Admission prediction endpoints may have limited functionality")
    else:
        logger.warning("Admission model loading disabled (ENABLE_ADMISSION_MODEL_LOAD=false)")

    # Initialize Roadmap Service
    if settings.ENABLE_ROADMAP:
        try:
            from app.services.roadmap_service import roadmap_service
            logger.info("Loading roadmap stages...")
            roadmap_service.load_stages()
            logger.info(f"Roadmap service initialized with {roadmap_service.get_total_stages()} stages")
        except Exception as e:
            logger.error(f"Failed to initialize roadmap service: {e}")
            logger.warning("Roadmap endpoints may not work properly")
    else:
        logger.warning("Roadmap initialization disabled (ENABLE_ROADMAP=false)")

    # Initialize Multi-Agent System
    if settings.ENABLE_MULTI_AGENT:
        try:
            logger.info("Initializing Multi-Agent System...")

            # Initialize MongoDB memory manager
            memory_manager = MongoDBMemoryManager(
                connection_string=settings.MONGODB_URI,
                database_name=settings.MONGODB_DATABASE
            )
            await memory_manager.initialize_indexes()
            logger.info("MongoDB memory manager initialized")

            # Initialize orchestrator
            multi_agent.init_orchestrator(
                mongo_uri=settings.MONGODB_URI,
                google_api_key=settings.GOOGLE_API_KEY,
                firecrawl_api_key=settings.FIRECRAWL_API_KEY
            )

            # Compile the LangGraph
            multi_agent.orchestrator.compile_graph()

            # Start session cleanup task
            await multi_agent.session_manager.start_cleanup_task()

            logger.info("Multi-Agent System initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Multi-Agent System: {e}")
            logger.warning("Multi-Agent endpoints will not be available")
    else:
        logger.warning("Multi-Agent initialization disabled (ENABLE_MULTI_AGENT=false)")

    yield

    # Cleanup on shutdown
    logger.info("Shutting down EduLen AI Service...")
    if settings.ENABLE_CHROMA:
        chroma_manager.close()

    # Close MongoDB connection
    if settings.ENABLE_MONGODB:
        await close_mongodb_connection()

    # Shutdown multi-agent system
    if multi_agent.session_manager:
        await multi_agent.session_manager.shutdown()
    if multi_agent.memory_manager:
        await multi_agent.memory_manager.close()

    logger.info("Shutdown complete")


app = FastAPI(
    title="EduLen AI Service",
    description="AI-powered services for study abroad applications including vector stores, tracking agents, and automation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - V1 APIs
app.include_router(roadmap.router, prefix="/api/v1/roadmap", tags=["Roadmap"])
app.include_router(dream_chat.router, prefix="/api/v1/dream", tags=["Dream Chat"])
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(documents.router, prefix="/api/v1", tags=["Documents"])
app.include_router(embeddings.router, prefix="/api/v1", tags=["Embeddings"])
app.include_router(ocr.router, prefix="/api/v1", tags=["OCR"])
app.include_router(search.router, prefix="/api/v1", tags=["Search"])
app.include_router(query.router, prefix="/api/v1", tags=["Query"])
app.include_router(faculty.router, prefix="/api/v1", tags=["Faculty Matching"])
app.include_router(admission.router, prefix="/api/v1", tags=["Admission Prediction"])
app.include_router(vector_store.router, prefix="/api/v1/vector-store", tags=["Vector Store"])
app.include_router(resume.router, prefix="/api/v1/resume", tags=["Resume Collection"])
app.include_router(cv.router, prefix="/api/v1/cv", tags=["CV Collection"])
app.include_router(sop.router, prefix="/api/v1/sop", tags=["SOP Collection"])
app.include_router(sop_analysis.router, prefix="/api/v1", tags=["SOP Analysis"])
app.include_router(sop_generator.router, prefix="/api/v1", tags=["SOP Generator"])
app.include_router(sop_upload.router, prefix="/api", tags=["SOP Upload Generator"])
app.include_router(sop_gen_routes.router, tags=["SOP Document Manager"])
app.include_router(sop_templates.router, tags=["SOP Templates"])
app.include_router(tracker.router, prefix="/api/v1/tracker", tags=["University Tracker"])
app.include_router(research.router, prefix="/api/v1/research", tags=["Research Agent"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["AI Agents"])
app.include_router(gradcafe_collection.router, prefix="/api/v1/gradcafe", tags=["GradCafe Collection"])
app.include_router(model_training.router, prefix="/api/v1", tags=["Model Training"])
app.include_router(files.router, prefix="/api/v1", tags=["File Management"])
app.include_router(analyzer.router, prefix="/api/v1/analyzer", tags=["Analyzer"])
# app.include_router(roadmap.router, prefix="/api/v1/roadmap", tags=["Roadmap"])

# Include Document Processing API (MongoDB + ChromaDB)
app.include_router(documents_processing.router, tags=["Document Processing"])

# Include Document Builder Chat API
from app.api.v1.document_builder_chat import router as document_builder_chat_router
app.include_router(document_builder_chat_router, prefix="/api/v1", tags=["Document Builder Chat"])

# Include SmartProfile API
app.include_router(smart_profile.router, prefix="/api/v1", tags=["SmartProfile"])

# Include Journey API (Roadmap-focused chat)
app.include_router(journey.router, prefix="/api/v1", tags=["Journey Chat"])

# Include routers - V2 APIs (Multi-Agent System)
app.include_router(multi_agent.router, prefix="/api/v2/multi-agent", tags=["Multi-Agent System"])
from app.api.chat_agent import router as chat_agent_router
app.include_router(chat_agent_router, tags=["Chat Agent"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "EduLen AI Service",
        "version": "2.0.0",
        "status": "operational",
        "features": {
            "multi_agent_system": "enabled",
            "langgraph_orchestration": "enabled",
            "firecrawl_mcp": "enabled",
            "mongodb_memory": "enabled"
        },
        "endpoints": {
            "v1": {
                "vector_store": "/api/v1/vector-store",
                "resume": "/api/v1/resume",
                "cv": "/api/v1/cv",
                "sop": "/api/v1/sop",
                "sop_analysis": "/api/v1/sop-analysis",
                "sop_generator": "/api/v1/sop-generator",
                "sop_documents": "/api/sop",
                "sop_templates": "/api/v1/sop-templates",
                "roadmap": "/api/v1/roadmap",
                "tracker": "/api/v1/tracker",
                "research": "/api/v1/research",
                "agents": "/api/v1/agents",
                "admission": "/api/v1/admission",
                "faculty": "/api/v1/faculty",
                "gradcafe": "/api/v1/gradcafe",
                "model_training": "/api/v1/model-training"
            },
            "v2": {
                "multi_agent": "/api/v2/multi-agent",
                "execute": "/api/v2/multi-agent/execute",
                "status": "/api/v2/multi-agent/status",
                "session_history": "/api/v2/multi-agent/session/history",
                "session_list": "/api/v2/multi-agent/session/list"
            },
            "chat": {
                "message": "/chat-agent/message",
                "sessions": "/chat-agent/sessions",
                "history": "/chat-agent/history"
            }
        },
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check ChromaDB connection
        chroma_manager.heartbeat()

        return {
            "status": "healthy",
            "services": {
                "chromadb": "operational",
                "api": "operational"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
