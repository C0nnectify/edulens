# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including Tesseract OCR
RUN apt-get update && apt-get install -y \
    ca-certificates \
    openssl \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy configuration files
COPY pyproject.toml .

# Copy application code
COPY ./app ./app
COPY main.py .

# Create README.md placeholder (required by pyproject.toml)
RUN touch README.md

# Install Python dependencies and the app package
RUN pip install --no-cache-dir .

# Install Playwright browsers (optional - may fail on some systems)
RUN playwright install chromium || echo "Playwright browser install skipped"

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD sh -c 'curl -f http://localhost:${PORT:-8000}/health || exit 1'

# Run the application (Render injects PORT)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
