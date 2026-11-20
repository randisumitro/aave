FROM python:3.11-slim

LABEL maintainer="Randi Sumitro <136390141+randisumitro@users.noreply.github.com>"
LABEL org.opencontainers.image.authors="Randi Sumitro"
LABEL org.opencontainers.image.source="https://github.com/randisumitro/aave"

WORKDIR /app

COPY setup.py .
RUN pip install --no-cache-dir -e .

COPY main.py .

EXPOSE 8000

CMD ["python", "main.py"]
