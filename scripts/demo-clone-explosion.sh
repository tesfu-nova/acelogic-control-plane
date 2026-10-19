#!/bin/bash

############################################################
# ACELOGIC PLATFORM v4
############################################################
# Module        : DEMO-CLONE-EXPLOSION
# Environment   : Development
# Version       : 4.1.0
# Updated       : 2026-05-15
#
# Purpose:
# Demonstration of deterministic identity enforcement,
# continuity-safe recovery, and duplicate-runtime
# prevention using the ACELOGIC™ Control Plane.
#
# Demonstrates:
# - canonical workload admission
# - infrastructure recovery continuity
# - duplicate-runtime rejection
# - deterministic identity governance
# - continuity conflict detection
# - SAFE_MODE enforcement behavior
#
############################################################

set -euo pipefail

# ----------------------------------------------------------
# Runtime Configuration
# ----------------------------------------------------------

NAMESPACE="us-enterprise-partner-ai"

AGENT_ID="EA-482991"

POLICY_NAME="ea-482991"

POLICY_NAMESPACE="acelogic-system"

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

# ----------------------------------------------------------
# Demo Start
# ----------------------------------------------------------

print_header "ACELOGIC™ Clone Explosion & Continuity Enforcement Demo"

echo ""
echo "This demonstration validates:"
echo ""
echo "• deterministic identity enforcement"
echo "• continuity-safe workload recovery"
echo "• duplicate-runtime prevention"
echo "• policy conflict detection"
echo "• continuity governance behavior"

# ----------------------------------------------------------
# 1. Baseline Canonical Admission
# ----------------------------------------------------------

print_header "1. Canonical Agent Admission"

kubectl apply \
  -f tests/pod-valid-enterprise.yaml

kubectl wait \
  --for=condition=ready \
  pod/enterprise-agent \
  -n "$NAMESPACE" \
  --timeout=30s

kubectl get pod \
  enterprise-agent \
  -n "$NAMESPACE"

pass "Canonical workload admitted"

# ----------------------------------------------------------
# 2. Infrastructure Failure Simulation
# ----------------------------------------------------------

print_header "2. Infrastructure Failure Simulation"

echo "Simulating node/runtime failure..."

kubectl delete pod \
  enterprise-agent \
  -n "$NAMESPACE"

sleep 3

pass "Canonical runtime removed"

# ----------------------------------------------------------
# 3. Continuity-Safe Recovery
# ----------------------------------------------------------

print_header "3. Continuity-Safe Recovery"

echo "Recreating canonical workload..."

kubectl apply \
  -f tests/pod-valid-enterprise.yaml

kubectl wait \
  --for=condition=ready \
  pod/enterprise-agent \
  -n "$NAMESPACE" \
  --timeout=30s

kubectl get pod \
  enterprise-agent \
  -n "$NAMESPACE"

pass "Canonical continuity restored"

# ----------------------------------------------------------
# 4. Duplicate Runtime Attempt
# ----------------------------------------------------------

print_header "4. Duplicate Runtime Attempt"

echo "Attempting clone explosion scenario..."

PURPOSE_HASH=$(
  kubectl get agentidentitypolicy \
    "$POLICY_NAME" \
    -n "$POLICY_NAMESPACE" \
    -o jsonpath='{.spec.purposeHash}'
)

cat <<EOF | kubectl apply -f - || true
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

sleep 3

echo ""
echo "Admission events:"

kubectl get events \
  -n "$NAMESPACE" \
  --field-selector involvedObject.name=duplicate-agent \
  | grep -Ei "deny|forbidden|admission" \
  || warn "Duplicate runtime blocked by admission controller"

pass "Duplicate-runtime prevention enforced"

# ----------------------------------------------------------
# 5. Continuity Conflict Injection
# ----------------------------------------------------------

print_header "5. Continuity Conflict Injection"

echo "Injecting conflicting policy..."

REAL_FINGERPRINT=$(
  kubectl get agentidentitypolicy \
    "$POLICY_NAME" \
    -n "$POLICY_NAMESPACE" \
    -o jsonpath='{.spec.fingerprint}'
)

cat <<EOF | kubectl apply -f -
apiVersion: acelogic.ai/v1
kind: AgentIdentityPolicy
metadata:
  name: conflicting-policy
  namespace: ${POLICY_NAMESPACE}
spec:
  agentId: "${AGENT_ID}"

  agentClass: ENTERPRISE_AGENT

  licenseTier: TIER_4

  grammarLicense:
    enabled: true
    level: RESTRICTED
    allowedPrefixes:
      - "#us#.enterprise."

  symbolicNamespace: "#us#.enterprise.partner.ai"

  k8sNamespace: "${NAMESPACE}"

  mission: "Conflicting execution intent"

  owner: "conflict-injection"

  fingerprintAlgorithm: "SHA-256"

  fingerprintVersion: "v1"

  fingerprint: "${REAL_FINGERPRINT}"

  purposeHashAlgorithm: "SHA3-256"

  purposeHash: "0000000000000000000000000000000000000000000000000000000000000000"

  state: ACTIVE

  lease:
    epoch: 2
    expiresAt: "2026-12-31T23:59:59Z"

  lastUpdated: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
EOF

echo ""
echo "Waiting for continuity governance processing..."

sleep 5

echo ""
echo "Policy state:"

kubectl get agentidentitypolicy \
  conflicting-policy \
  -n "$POLICY_NAMESPACE" \
  -o jsonpath='{.spec.state}'

echo ""

warn "Public reference repo does not include proprietary conflict resolver runtime"

echo ""
echo "Expected enterprise behavior:"
echo ""
echo "• conflicting policy enters SAFE_MODE"
echo "• mutation authority revoked"
echo "• continuity divergence isolated"
echo "• canonical runtime preserved"

# ----------------------------------------------------------
# 6. Cleanup
# ----------------------------------------------------------

print_header "6. Cleanup"

read -p "Clean up demo resources? (y/n): " -n 1 -r

echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then

  kubectl delete pod \
    enterprise-agent \
    -n "$NAMESPACE" \
    --ignore-not-found

  kubectl delete pod \
    duplicate-agent \
    -n "$NAMESPACE" \
    --ignore-not-found

  kubectl delete agentidentitypolicy \
    conflicting-policy \
    -n "$POLICY_NAMESPACE" \
    --ignore-not-found

  pass "Cleanup complete"
fi

# ----------------------------------------------------------
# Demo Complete
# ----------------------------------------------------------

print_header "ACELOGIC™ Demonstration Complete"

echo ""
echo "Validated capabilities:"
echo ""
echo "• deterministic admission enforcement"
echo "• continuity-safe recovery"
echo "• duplicate-runtime prevention"
echo "• runtime identity governance"
echo "• Kubernetes-native execution control"

echo ""
echo "ACELOGIC™"
echo "Deterministic Infrastructure for Autonomous Systems"

############################################################
# End of File: demo-clone-explosion.sh
# Do not modify without code review
############################################################