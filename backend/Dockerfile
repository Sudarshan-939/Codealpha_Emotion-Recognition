FROM python:3.11-slim

WORKDIR /app

# System dependencies for librosa, soundfile, numpy
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    libsndfile1-dev \
    ffmpeg \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY . .

# Create data directories
RUN mkdir -p data/raw data/features saved_models/production

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
