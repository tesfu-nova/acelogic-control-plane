#!/bin/bash

############################################################
# ACELOGIC PLATFORM v4
############################################################
# Module        : DEMO-ENHANCED
# Environment   : Development
# Version       : 4.1.0
# Updated       : 2026-05-15
#
# Purpose:
# Enhanced deterministic governance demonstration
# for the ACELOGIC™ Control Plane.
#
# Demonstrates:
# - identity continuity
# - deterministic admission enforcement
# - duplicate-runtime prevention
# - fail-closed governance
# - lease enforcement
# - namespace validation
# - runtime recovery continuity
# - structured audit logging
#
############################################################

set -euo pipefail

# ----------------------------------------------------------
# Runtime Configuration
# ----------------------------------------------------------

NAMESPACE="us-enterprise-partner-ai"

AGENT_ID="EA-482991"

POLICY_NAME="ea-482991"

DEPLOY_NAMESPACE="acelogic-system"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

# ----------------------------------------------------------
# Console Helpers
# ----------------------------------------------------------

print_header() {

  echo ""
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

pass() {
  echo "✅ $1"
}

warn() {
  echo "⚠️  $1"
}

fail() {
  echo "❌ $1"
}

# ----------------------------------------------------------
# Time Kubernetes Admission
# ----------------------------------------------------------

time_kubectl_apply() {

  local manifest="$1"

  local start
  local end

  start=$(date +%s%N)

  echo "$manifest" | kubectl apply -f - >/dev/null 2>&1

  end=$(date +%s%N)

  echo "$(( (end - start) / 1000000 )) ms"
}

# ----------------------------------------------------------
# Fetch Purpose Hash
# ----------------------------------------------------------

PURPOSE_HASH=$(
  kubectl get agentidentitypolicy \
    "$POLICY_NAME" \
    -n "$DEPLOY_NAMESPACE" \
    -o jsonpath='{.spec.purposeHash}'
)

# ----------------------------------------------------------
# Demo Start
# ----------------------------------------------------------

print_header "ACELOGIC™ Enhanced Deterministic Governance Demo"

# ----------------------------------------------------------
# 1. Baseline Runtime
# ----------------------------------------------------------

print_header "1. Baseline Canonical Runtime"

kubectl apply -f tests/pod-valid-enterprise.yaml

kubectl wait \
  --for=condition=ready \
  pod/enterprise-agent \
  -n "$NAMESPACE" \
  --timeout=30s

kubectl get pod enterprise-agent -n "$NAMESPACE"

pass "Canonical runtime admitted successfully"

# ----------------------------------------------------------
# 2. Admission Latency
# ----------------------------------------------------------

print_header "2. Admission Webhook Latency"

VALID_MANIFEST=$(cat <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: latency-test
  namespace: ${NAMESPACE}
  labels:
    acelogic.ai/agent-id: "${AGENT_ID}"
  annotations:
    acelogic.ai/symbolic-namespace: "#us#.enterprise.partner.ai"
    acelogic.ai/purpose-hash: "${PURPOSE_HASH}"
spec:
  containers:
    - name: agent
      image: nginx:stable
EOF
)

echo -n "Admission round-trip time: "

time_kubectl_apply "$VALID_MANIFEST"

kubectl delete pod latency-test \
  -n "$NAMESPACE" \
  --ignore-not-found >/dev/null 2>&1

# ----------------------------------------------------------
# 3. Runtime Recovery Continuity
# ----------------------------------------------------------

print_header "3. Runtime Recovery Continuity"

kubectl delete pod enterprise-agent \
  -n "$NAMESPACE"

sleep 3

kubectl apply -f tests/pod-valid-enterprise.yaml

kubectl wait \
  --for=condition=ready \
  pod/enterprise-agent \
  -n "$NAMESPACE" \
  --timeout=30s

pass "Runtime continuity preserved after recovery"

# ----------------------------------------------------------
# 4. Duplicate Runtime Prevention
# ----------------------------------------------------------

print_header "4. Duplicate Runtime Prevention"

DUPLICATE_OUTPUT=$(
cat <<EOF | kubectl apply -f - 2>&1 || true
apiVersion: v1
kind: Pod
metadata:
  name: duplicate-agent
  namespace: ${NAMESPACE}
  labels:
    acelogic.ai/agent-id: "${AGENT_ID}"
  annotations:
    acelogic.ai/symbolic-namespace: "#us#.enterprise.partner.ai"
    acelogic.ai/purpose-hash: "${PURPOSE_HASH}"
spec:
  containers:
    - name: agent
      image: nginx:stable
EOF
)

if echo "$DUPLICATE_OUTPUT" | grep -qi "denied"; then
  pass "Duplicate runtime denied"
else
  warn "Duplicate runtime unexpectedly admitted"
fi

# ----------------------------------------------------------
# 5. Namespace Projection Enforcement
# ----------------------------------------------------------

print_header "5. Namespace Projection Enforcement"

NAMESPACE_OUTPUT=$(
cat <<EOF | kubectl apply -f - 2>&1 || true
apiVersion: v1
kind: Pod
metadata:
  name: invalid-namespace
  namespace: default
  labels:
    acelogic.ai/agent-id: "${AGENT_ID}"
  annotations:
    acelogic.ai/symbolic-namespace: "#us#.enterprise.partner.ai"
    acelogic.ai/purpose-hash: "${PURPOSE_HASH}"
spec:
  containers:
    - name: agent
      image: nginx:stable
EOF
)

if echo "$NAMESPACE_OUTPUT" | grep -qi "denied"; then
  pass "Namespace projection mismatch denied"
else
  warn "Namespace enforcement failed"
fi

# ----------------------------------------------------------
# 6. Lease Governance Enforcement
# ----------------------------------------------------------

print_header "6. Lease Governance Enforcement"

kubectl patch agentidentitypolicy \
  "$POLICY_NAME" \
  -n "$DEPLOY_NAMESPACE" \
  --type merge \
  -p '{"spec":{"lease":{"expiresAt":"2000-01-01T00:00:00Z"}}}'

sleep 3

LEASE_OUTPUT=$(
cat <<EOF | kubectl apply -f - 2>&1 || true
apiVersion: v1
kind: Pod
metadata:
  name: expired-lease
  namespace: ${NAMESPACE}
  labels:
    acelogic.ai/agent-id: "${AGENT_ID}"
  annotations:
    acelogic.ai/symbolic-namespace: "#us#.enterprise.partner.ai"
    acelogic.ai/purpose-hash: "${PURPOSE_HASH}"
spec:
  containers:
    - name: agent
      image: nginx:stable
EOF
)

if echo "$LEASE_OUTPUT" | grep -qi "denied"; then
  pass "Expired lease denied"
else
  warn "Lease enforcement failed"
fi

# Restore lease

kubectl patch agentidentitypolicy \
  "$POLICY_NAME" \
  -n "$DEPLOY_NAMESPACE" \
  --type merge \
  -p '{"spec":{"lease":{"expiresAt":"2026-12-31T23:59:59Z"}}}'

sleep 3

# ----------------------------------------------------------
# 7. Fail-Closed Governance
# ----------------------------------------------------------

print_header "7. Fail-Closed Governance"

kubectl scale deployment acelogic-evaluator \
  -n "$DEPLOY_NAMESPACE" \
  --replicas=0

sleep 5

FAIL_CLOSED_OUTPUT=$(
kubectl apply -f tests/pod-valid-enterprise.yaml 2>&1 || true
)

if echo "$FAIL_CLOSED_OUTPUT" | grep -qiE "failed|error|Internal"; then
  pass "Fail-closed enforcement confirmed"
else
  warn "Unexpected fail-open behavior detected"
fi

kubectl delete pod enterprise-agent \
  -n "$NAMESPACE" \
  --ignore-not-found >/dev/null 2>&1

# ----------------------------------------------------------
# 8. DELETE Fail-Open Behavior
# ----------------------------------------------------------

print_header "8. DELETE Fail-Open Validation"

kubectl run test-delete \
  --image=nginx:stable \
  -n "$NAMESPACE"

kubectl delete pod test-delete \
  -n "$NAMESPACE"

pass "DELETE operation allowed during governance interruption"

# ----------------------------------------------------------
# 9. Restore Admission Infrastructure
# ----------------------------------------------------------

print_header "9. Restore Admission Infrastructure"

kubectl scale deployment acelogic-evaluator \
  -n "$DEPLOY_NAMESPACE" \
  --replicas=1

kubectl wait \
  --for=condition=ready \
  pod \
  -l app=acelogic-evaluator \
  -n "$DEPLOY_NAMESPACE" \
  --timeout=60s

kubectl apply -f tests/pod-valid-enterprise.yaml

kubectl wait \
  --for=condition=ready \
  pod/enterprise-agent \
  -n "$NAMESPACE" \
  --timeout=30s

pass "Admission infrastructure restored"

# ----------------------------------------------------------
# 10. Structured Audit Logs
# ----------------------------------------------------------

print_header "10. Structured Audit Logs"

kubectl logs \
  -n "$DEPLOY_NAMESPACE" \
  -l app=acelogic-evaluator \
  --tail=10

# ----------------------------------------------------------
# Cleanup
# ----------------------------------------------------------

echo ""

read -p "Clean up demo resources? (y/n): " -n 1 -r

echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then

  kubectl delete pod enterprise-agent \
    -n "$NAMESPACE" \
    --ignore-not-found

  kubectl delete pod duplicate-agent \
    -n "$NAMESPACE" \
    --ignore-not-found

  kubectl delete pod invalid-namespace \
    -n "$NAMESPACE" \
    --ignore-not-found

  kubectl delete pod expired-lease \
    -n "$NAMESPACE" \
    --ignore-not-found

  echo ""

  pass "Cleanup complete"
fi

# ----------------------------------------------------------
# Demo Complete
# ----------------------------------------------------------

print_header "ACELOGIC™ Demo Complete"

echo "Deterministic governance validation complete."

############################################################
# End of File: demo-enhanced.sh
# Do not modify without code review
############################################################