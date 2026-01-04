# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including Tesseract OCR
RUN apt-get update && apt-get install -y \
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

# Install Python dependencies and the app package
RUN pip install --no-cache-dir .

# Install Playwright browsers (if needed)
RUN pip install playwright && playwright install --with-deps chromium

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
