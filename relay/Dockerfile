FROM alpine:3.19

RUN apk add --no-cache ca-certificates curl tar

WORKDIR /relay

RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then FRP_ARCH="amd64"; \
    elif [ "$ARCH" = "aarch64" ]; then FRP_ARCH="arm64"; \
    else FRP_ARCH="amd64"; fi && \
    curl -sSL "https://github.com/fatedier/frp/releases/download/v0.56.0/frp_0.56.0_linux_${FRP_ARCH}.tar.gz" -o /tmp/frp.tar.gz && \
    tar -xzf /tmp/frp.tar.gz -C /tmp && \
    mv /tmp/frp_0.56.0_linux_${FRP_ARCH}/frps /usr/local/bin/frps && \
    chmod +x /usr/local/bin/frps && \
    rm -rf /tmp/frp*

COPY frps.toml /etc/frp/frps.toml

EXPOSE 2333 2333/udp
EXPOSE 25565-25600

CMD ["/usr/local/bin/frps", "-c", "/etc/frp/frps.toml"]
