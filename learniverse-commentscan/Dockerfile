# ============================================================
# Vietnamese Comment Moderation Service
# ============================================================
# Multi-stage build for smaller image size

# Stage 1: Builder
FROM python:3.11-slim as builder

ARG FORCE_CPU=1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Install CPU-only torch
RUN if [ -n "$FORCE_CPU" ]; then \
        pip install --no-warn-script-location --no-cache-dir --user torch --index-url https://download.pytorch.org/whl/cpu; \
        echo "CPU only"; \
    fi
# Install the rest
COPY requirements.txt .
RUN pip install --no-warn-script-location --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim as runtime

WORKDIR /app

# Install runtime dependencies for underthesea
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY src/ ./src/
COPY data/models/ ./data/models/

# Create necessary directories
RUN mkdir -p data/models/deployment

# Expose port
EXPOSE 8000

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
