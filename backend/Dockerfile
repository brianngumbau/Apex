FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for building common Python packages (e.g., psycopg2, eventlet)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment for dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Only copy requirements first for better caching
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy application source
COPY app ./app
COPY add_cancelled_enum.py ./add_cancelled_enum.py
COPY encoded.py ./encoded.py
COPY generate_security_credential.py ./generate_security_credential.py

# --- Runtime image ---
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    FLASK_ENV=production

WORKDIR /app

# Install only runtime libs (e.g., libpq5 for psycopg2 binary linkage)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy venv and source from builder
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

EXPOSE 5000

# Basic healthcheck for liveness
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5000/').read(); print('ok')" || exit 1

# Use Gunicorn with eventlet for Flask-SocketIO
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "-b", "0.0.0.0:5000", "app.app:app"]

