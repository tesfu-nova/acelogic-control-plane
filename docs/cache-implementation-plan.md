# Policy Cache Architecture

## Current Implementation

The ACELOGIC™ admission layer currently uses a periodic reconciliation loop to refresh the in-memory policy cache from Kubernetes.

Current refresh interval:

```text
10 seconds
```

This guarantees cluster-local policy availability even during transient watch failures.

---

# Production Target

The production architecture transitions the policy layer to a Kubernetes-native shared informer model for `AgentIdentityPolicy` resources.

This enables:

- event-driven cache synchronization
- near-instant policy propagation
- reduced Kubernetes API server load
- deterministic cluster-local policy availability
- lower admission-path latency

The architecture follows standard Kubernetes controller-runtime patterns.

---

# Planned Runtime Flow

```text
AgentIdentityPolicy CRD
            │
            ▼
 Kubernetes Watch / Informer
            │
            ▼
 Cluster-local Cache Update
            │
            ▼
 Admission Evaluation Layer
            │
            ▼
 ALLOW / DENY / SAFE_MODE
```

---

# Implementation Strategy

Planned implementation includes:

- Kubernetes watch-based synchronization
- informer-driven cache reconciliation
- incremental add/update/delete event handling
- cluster-local memory cache updates
- elimination of periodic polling on the admission critical path

Potential implementations include:

- `@kubernetes/client-node`
- Kubernetes informer abstractions
- controller-runtime style reconciliation patterns

---

# Operational Impact

Transitioning to informer-based synchronization improves:

- admission latency
- policy propagation speed
- cluster scalability
- API server efficiency
- runtime enforcement responsiveness

because admission decisions no longer require periodic full-list synchronization behavior.

---

# Resilience & Fallback

ACELOGIC™ maintains deterministic fail-safe behavior.

If informer synchronization fails to initialize or becomes unavailable:

- the system automatically falls back to periodic reconciliation
- cluster-local policy continuity remains preserved
- runtime enforcement remains operational

This ensures continuity-safe enforcement during degraded cluster conditions.

---

# Admission Enforcement Policy

## Fail-Closed Operations

The following operations are fail-closed:

- CREATE
- UPDATE

If the ACELOGIC™ admission layer:

- becomes unreachable
- returns an error
- loses policy validation capability
- fails continuity verification

the workload is denied admission.

This prevents workloads from entering execution without:

- identity validation
- continuity verification
- policy enforcement
- runtime authority validation

---

## Fail-Open Operations

DELETE operations remain fail-open.

Deletion requests are always permitted to ensure:

- cluster recovery capability
- operational safety
- workload cleanup
- infrastructure recoverability

even during degraded admission-layer conditions.

This prevents infrastructure lock-in scenarios during cluster recovery events.