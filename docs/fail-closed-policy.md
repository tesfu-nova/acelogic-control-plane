# ACELOGIC™ Admission Enforcement Policy

## Fail-Closed Operations

CREATE and UPDATE operations are enforced as fail-closed.

If the ACELOGIC™ admission layer:

- becomes unreachable
- returns an error
- fails policy validation
- loses continuity verification capability
- rejects execution authorization

the workload is denied admission.

This ensures workloads cannot enter execution without:

- deterministic identity verification
- continuity validation
- policy enforcement
- runtime authority approval

Fail-closed enforcement preserves canonical execution integrity and prevents unauthorized or divergent runtime activation.

---

## Fail-Open Operations

DELETE operations remain fail-open.

The ACELOGIC™ admission layer does not intercept deletion requests.

Workload deletion is always permitted, including during degraded admission-layer conditions, to ensure:

- cluster recoverability
- operational safety
- workload cleanup
- infrastructure restoration capability

This prevents infrastructure lock-in scenarios during recovery or partial system failure events.