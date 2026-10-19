#!/bin/bash

############################################################
# ACELOGIC PLATFORM v4
############################################################
# Module        : DEPLOY
# Environment   : Development
# Version       : 4.1.0
# Updated       : 2026-05-15
#
# Purpose:
# Deployment automation for the ACELOGIC™ Control Plane
# local Kubernetes validation environment.
#
# Responsibilities:
# - build evaluator image
# - load image into kind
# - apply CRD and RBAC
# - provision TLS secret
# - deploy admission webhook
# - patch CA bundle
# - apply namespace projection
# - apply AgentIdentityPolicy
#
############################################################

set -euo pipefail

# ----------------------------------------------------------
# Runtime Configuration
# ----------------------------------------------------------

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-acelogic}"

IMAGE_NAME="${IMAGE_NAME:-acelogic/evaluator:v4.1.0}"

SYSTEM_NAMESPACE="acelogic-system"

WEBHOOK_NAME="acelogic-evaluator"

TLS_DIR="${ROOT_DIR}/local-policy-evaluator/tls"

cd "$ROOT_DIR"

echo ""
echo "============================================================"
echo "ACELOGIC™ Control Plane Deployment"
echo "============================================================"
echo "Cluster: ${KIND_CLUSTER_NAME}"
echo "Image:   ${IMAGE_NAME}"
echo ""

# ----------------------------------------------------------
# Validate TLS Materials
# ----------------------------------------------------------

if [[ ! -f "${TLS_DIR}/tls.crt" || ! -f "${TLS_DIR}/tls.key" || ! -f "${TLS_DIR}/ca.crt" ]]; then
  echo "❌ Missing TLS files in ${TLS_DIR}"
  echo "Run: ./scripts/generate-certs.sh"
  exit 1
fi

# ----------------------------------------------------------
# Build Local Policy Evaluator Image
# ----------------------------------------------------------

echo "Building ACELOGIC evaluator image..."

docker build \
  -t "${IMAGE_NAME}" \
  ./local-policy-evaluator

# ----------------------------------------------------------
# Load Image Into kind
# ----------------------------------------------------------

echo "Loading image into kind cluster..."

kind load docker-image \
  "${IMAGE_NAME}" \
  --name "${KIND_CLUSTER_NAME}"

# ----------------------------------------------------------
# Apply CRD + RBAC
# ----------------------------------------------------------

echo "Applying AgentIdentityPolicy CRD..."

kubectl apply \
  -f crd/agentidentitypolicy-crd.yaml

echo "Applying RBAC..."

kubectl apply \
  -f k8s/rbac.yaml

# ----------------------------------------------------------
# Provision TLS Secret
# ----------------------------------------------------------

echo "Creating evaluator TLS secret..."

kubectl create secret generic acelogic-evaluator-tls \
  --from-file=tls.crt="${TLS_DIR}/tls.crt" \
  --from-file=tls.key="${TLS_DIR}/tls.key" \
  -n "${SYSTEM_NAMESPACE}" \
  --dry-run=client \
  -o yaml | kubectl apply -f -

# ----------------------------------------------------------
# Deploy Evaluator Service + Deployment
# ----------------------------------------------------------

echo "Deploying evaluator service..."

kubectl apply \
  -f k8s/evaluator-service.yaml

echo "Deploying evaluator workload..."

kubectl apply \
  -f k8s/evaluator-deployment.yaml

kubectl wait \
  --for=condition=ready \
  pod \
  -l app=acelogic-evaluator \
  -n "${SYSTEM_NAMESPACE}" \
  --timeout=90s

# ----------------------------------------------------------
# Apply Validating Webhook
# ----------------------------------------------------------

echo "Applying validating webhook..."

kubectl apply \
  -f k8s/validating-webhook.yaml

# ----------------------------------------------------------
# Patch Webhook CA Bundle
# ----------------------------------------------------------

echo "Patching webhook CA bundle..."

CA_BUNDLE="$(
  base64 < "${TLS_DIR}/ca.crt" | tr -d '\n'
)"

kubectl patch validatingwebhookconfiguration "${WEBHOOK_NAME}" \
  --type='json' \
  -p="[
    {
      \"op\": \"replace\",
      \"path\": \"/webhooks/0/clientConfig/caBundle\",
      \"value\": \"${CA_BUNDLE}\"
    }
  ]" || \
kubectl patch validatingwebhookconfiguration "${WEBHOOK_NAME}" \
  --type='json' \
  -p="[
    {
      \"op\": \"add\",
      \"path\": \"/webhooks/0/clientConfig/caBundle\",
      \"value\": \"${CA_BUNDLE}\"
    }
  ]"

# ----------------------------------------------------------
# Apply Namespace Projection + Identity Policy
# ----------------------------------------------------------

echo "Applying governed namespace projection..."

kubectl apply \
  -f config-sync-repo/namespaces/us-enterprise-partner-ai.yaml

echo "Applying AgentIdentityPolicy..."

kubectl apply \
  -f config-sync-repo/identities/ea-482991.yaml

# ----------------------------------------------------------
# Deployment Summary
# ----------------------------------------------------------

echo ""
echo "============================================================"
echo "ACELOGIC™ Deployment Complete"
echo "============================================================"
echo "Evaluator:       ${WEBHOOK_NAME}"
echo "Namespace:       ${SYSTEM_NAMESPACE}"
echo "Policy CRD:      AgentIdentityPolicy"
echo "Governed NS:     us-enterprise-partner-ai"
echo "Mode:            fail-closed"
echo "============================================================"
echo ""

############################################################
# End of File: deploy.sh
# Do not modify without code review
############################################################