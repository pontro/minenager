FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /relay

COPY bin/frps /usr/local/bin/frps
RUN chmod +x /usr/local/bin/frps

COPY frps.toml /etc/frp/frps.toml

EXPOSE 2333 2333/udp
EXPOSE 25565-25600

CMD ["/usr/local/bin/frps", "-c", "/etc/frp/frps.toml"]
