FROM python:3.11-slim

# Install standard Java JRE headless and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jre-headless \
    curl \
    git \
    tar \
    && rm -rf /var/lib/apt/lists/*

# Automatically install frpc binary for the container's architecture
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then FRP_ARCH="amd64"; \
    elif [ "$ARCH" = "arm64" ]; then FRP_ARCH="arm64"; \
    else FRP_ARCH="amd64"; fi && \
    curl -sSL "https://github.com/fatedier/frp/releases/download/v0.56.0/frp_0.56.0_linux_${FRP_ARCH}.tar.gz" -o /tmp/frp.tar.gz && \
    tar -xzf /tmp/frp.tar.gz -C /tmp && \
    mv /tmp/frp_0.56.0_linux_${FRP_ARCH}/frpc /usr/local/bin/frpc && \
    chmod +x /usr/local/bin/frpc && \
    rm -rf /tmp/frp*

WORKDIR /code

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

# Expose Dashboard web port (3000) and Minecraft server port (25565)
EXPOSE 3000
EXPOSE 25565

# Run FastAPI dashboard on port 3000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3000", "--reload"]
