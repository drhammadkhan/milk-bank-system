FROM python:3.11-slim

WORKDIR /app

# Install CUPS and printing utilities
RUN apt-get update && apt-get install -y \
    cups \
    cups-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src /app/src

EXPOSE 8000

CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
