FROM python:3.11-slim

# Install standard Java JRE headless and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jre-headless \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

# Expose Dashboard web port (3000) and Minecraft server port (25565)
EXPOSE 3000
EXPOSE 25565

# Run FastAPI dashboard on port 3000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3000", "--reload"]
