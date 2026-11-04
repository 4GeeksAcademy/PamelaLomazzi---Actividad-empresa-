FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1

WORKDIR /app/services
RUN pip install --no-cache-dir uv
COPY requirements.txt ./requirements.txt
COPY api/requirements.txt ./api/requirements.txt
RUN uv pip install --no-cache -r requirements.txt

COPY . .
WORKDIR /app
RUN mkdir -p /app/data

EXPOSE 8000
CMD ["uvicorn", "services.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app/services"]