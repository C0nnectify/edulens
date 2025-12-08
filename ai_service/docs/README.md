# AI Service Documentation

This directory contains comprehensive documentation for the EduLen AI Service - a FastAPI microservice providing document processing, embeddings, semantic search, and ML-powered features.

## Quick Start

**New to the AI Service?** Start here:
- [`guides/QUICKSTART.md`](./guides/QUICKSTART.md) - Get up and running quickly
- [`guides/QUICK_REFERENCE.md`](./guides/QUICK_REFERENCE.md) - Common commands and API endpoints
- [`guides/NEXTJS_INTEGRATION_GUIDE.md`](./guides/NEXTJS_INTEGRATION_GUIDE.md) - Integrate with Next.js frontend

## Documentation Structure

### `/admission/` - Admission Prediction System
ML-powered graduate school admission chance prediction based on historical data.

- [`ADMISSION_ARCHITECTURE.md`](./admission/ADMISSION_ARCHITECTURE.md) - System architecture and design
- [`ADMISSION_PREDICTION_README.md`](./admission/ADMISSION_PREDICTION_README.md) - Feature overview and usage
- [`ADMISSION_IMPLEMENTATION_SUMMARY.md`](./admission/ADMISSION_IMPLEMENTATION_SUMMARY.md) - Implementation details

### `/sop/` - Statement of Purpose (SOP) Tools
AI-powered SOP generation, analysis, and templates.

- [`SOP_GENERATOR_README.md`](./sop/SOP_GENERATOR_README.md) - SOP generator overview
- [`SOP_GENERATOR_API_REFERENCE.md`](./sop/SOP_GENERATOR_API_REFERENCE.md) - API endpoints reference
- [`SOP_GENERATOR_QUICKSTART.md`](./sop/SOP_GENERATOR_QUICKSTART.md) - Quick start guide
- [`SOP_ANALYSIS_SERVICE_README.md`](./sop/SOP_ANALYSIS_SERVICE_README.md) - SOP analysis features
- [`SOP_ANALYSIS_QUICK_START.md`](./sop/SOP_ANALYSIS_QUICK_START.md) - Analysis quick start
- [`SOP_TEMPLATE_LIBRARY.md`](./sop/SOP_TEMPLATE_LIBRARY.md) - Template library documentation
- [`SOP_QUICK_START.md`](./sop/SOP_QUICK_START.md) - General SOP tools quick start
- [`SOP_ANALYSIS_IMPLEMENTATION_SUMMARY.md`](./sop/SOP_ANALYSIS_IMPLEMENTATION_SUMMARY.md) - Implementation summary

### `/faculty/` - Faculty Research Matching
Faculty scraping and research interest matching for PhD applications.

- [`FACULTY_MATCHING_README.md`](./faculty/FACULTY_MATCHING_README.md) - Matching algorithm overview
- [`FACULTY_SCRAPING_SERVICE.md`](./faculty/FACULTY_SCRAPING_SERVICE.md) - Web scraping service
- [`FACULTY_SCRAPING_QUICKSTART.md`](./faculty/FACULTY_SCRAPING_QUICKSTART.md) - Quick start guide
- [`FACULTY_API_QUICK_REFERENCE.md`](./faculty/FACULTY_API_QUICK_REFERENCE.md) - API reference

### `/gradcafe/` - GradCafe Data Collection
Historical admission results scraping and analysis from GradCafe.

- [`GRADCAFE_COLLECTION_README.md`](./gradcafe/GRADCAFE_COLLECTION_README.md) - Data collection overview
- [`GRADCAFE_IMPLEMENTATION_SUMMARY.md`](./gradcafe/GRADCAFE_IMPLEMENTATION_SUMMARY.md) - Implementation details
- [`GRADCAFE_QUICK_START.md`](./gradcafe/GRADCAFE_QUICK_START.md) - Quick start guide

### `/ml-training/` - Machine Learning Training Pipeline
Model training infrastructure for admission prediction and other ML features.

- [`MODEL_TRAINING_README.md`](./ml-training/MODEL_TRAINING_README.md) - Training pipeline overview
- [`ML_TRAINING_PIPELINE_GUIDE.md`](./ml-training/ML_TRAINING_PIPELINE_GUIDE.md) - Pipeline setup guide
- [`ML_TRAINING_QUICK_START.md`](./ml-training/ML_TRAINING_QUICK_START.md) - Quick start
- [`ML_TRAINING_IMPLEMENTATION_SUMMARY.md`](./ml-training/ML_TRAINING_IMPLEMENTATION_SUMMARY.md) - Implementation details

### `/guides/` - General Guides
Getting started guides and integration documentation.

- [`QUICKSTART.md`](./guides/QUICKSTART.md) - Service quick start
- [`QUICK_REFERENCE.md`](./guides/QUICK_REFERENCE.md) - Command and API reference
- [`NEXTJS_INTEGRATION_GUIDE.md`](./guides/NEXTJS_INTEGRATION_GUIDE.md) - Next.js integration
- [`DOCUMENT_AI_README.md`](./guides/DOCUMENT_AI_README.md) - Document AI features

### Root Documentation
- [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) - Overall implementation summary
- [`MULTI_AGENT_README.md`](./MULTI_AGENT_README.md) - Multi-agent system architecture
- [`NEW_AGENTS_SUMMARY.md`](./NEW_AGENTS_SUMMARY.md) - Newly added agents
- [`LATEST_AGENTS_SUMMARY.md`](./LATEST_AGENTS_SUMMARY.md) - Latest agent updates

## Service Architecture

The AI Service is built with:
- **FastAPI** - Modern async web framework
- **LangChain/LangGraph** - LLM orchestration and multi-agent workflows
- **MongoDB** - Document metadata and persistence
- **ChromaDB** - Vector embeddings and semantic search
- **Celery + Redis** - Background task processing
- **OpenAI/Cohere/HuggingFace** - Embedding and LLM providers

## Common Tasks

### Start the Service
```bash
cd ai_service
./start.sh  # Creates venv, installs deps, starts server
```

### Run with Docker
```bash
cd ai_service
docker-compose up -d
```

### API Documentation
Once running, visit: `http://localhost:8000/docs` for interactive Swagger UI

### Testing
```bash
pytest tests/
```

## Integration with Next.js

The AI service is designed to work seamlessly with the Next.js frontend:
1. Next.js API routes proxy requests to the AI service
2. JWT tokens from Better Auth are validated by the AI service
3. User-specific data isolation using `user_id` from JWT

See [`guides/NEXTJS_INTEGRATION_GUIDE.md`](./guides/NEXTJS_INTEGRATION_GUIDE.md) for details.

## Contributing

When adding new documentation:
1. Place it in the appropriate category folder
2. Use descriptive naming (UPPERCASE_WITH_UNDERSCORES.md)
3. Update this README with links to new docs
4. Include code examples and API references where applicable
