FROM python:3.12.12 AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

RUN python -m venv .venv
COPY backend/requirements.txt ./
RUN .venv/bin/pip install -r requirements.txt

FROM python:3.12.12-slim
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY backend/ .

# Make sure the virtual environment is in PATH
ENV PATH="/app/.venv/bin:$PATH"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]