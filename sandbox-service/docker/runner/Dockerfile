FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-21-jdk-headless \
    g++ \
    python3 \
    nodejs \
    npm \
    golang-go \
    ca-certificates \
    && npm install -g typescript@5.7.2 \
    && useradd -m -u 1001 -s /bin/sh sandbox \
    && rm -rf /var/lib/apt/lists/*

USER sandbox
WORKDIR /workspace
