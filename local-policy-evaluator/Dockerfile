############################################################
# ACELOGIC PLATFORM v4
############################################################
# Module        : DOCKERFILE
# Environment   : Development
# Version       : 4.1.0
# Updated       : 2026-05-15
#
# Purpose:
# Container image for the ACELOGIC™
# Local Policy Evaluator admission webhook.
#
# Responsibilities:
# - deterministic runtime admission enforcement
# - secure HTTPS webhook execution
# - minimal attack surface
# - production-grade container hardening
#
############################################################

# ----------------------------------------------------------
# Base Runtime
# ----------------------------------------------------------

FROM node:20-alpine

# ----------------------------------------------------------
# Metadata
# ----------------------------------------------------------

LABEL org.opencontainers.image.title="ACELOGIC Evaluator"
LABEL org.opencontainers.image.vendor="NOVA X Quantum Inc."
LABEL org.opencontainers.image.description="Deterministic identity and continuity admission evaluator for Kubernetes-native autonomous systems infrastructure."

# ----------------------------------------------------------
# Runtime Environment
# ----------------------------------------------------------

ENV NODE_ENV=production

WORKDIR /app

# ----------------------------------------------------------
# Install Dependencies
# ----------------------------------------------------------

COPY package*.json ./

RUN npm install --omit=dev

# ----------------------------------------------------------
# Application Source
# ----------------------------------------------------------

COPY src ./src

# ----------------------------------------------------------
# TLS Directory
# ----------------------------------------------------------

RUN mkdir -p /app/tls

# ----------------------------------------------------------
# Non-Root Runtime User
# ----------------------------------------------------------

RUN addgroup -S acelogic && \
    adduser -S acelogic -G acelogic

RUN chown -R acelogic:acelogic /app

USER acelogic

# ----------------------------------------------------------
# HTTPS Admission Port
# ----------------------------------------------------------

EXPOSE 8443

# ----------------------------------------------------------
# Runtime Healthcheck
# ----------------------------------------------------------

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-check-certificate -qO- https://127.0.0.1:8443/healthz || exit 1

# ----------------------------------------------------------
# Startup Command
# ----------------------------------------------------------

CMD ["node", "src/server.js"]

############################################################
# End of File: Dockerfile
# Do not modify without code review
############################################################