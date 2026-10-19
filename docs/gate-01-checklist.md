# Gate 01 — Implementation Checklist

**Owner:** Tesfu
**Deadline:** 

## 16 Control Plane Scope Items

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Identity verification | DONE | src/gate01/checks/identity + evaluator |
| 2 | Organization verification | PENDING | Needs Shompod contract |
| 3 | Entitlement resolution | PENDING | Needs Shompod contract |
| 4 | Canonical Runtime ID verification | PENDING | Needs Subham contract |
| 5 | Runtime Instance ID verification | PENDING | Needs Subham contract |
| 6 | Runtime authorization + binding | PENDING | Needs Subham contract |
| 7 | Runtime attestation / lineage | PENDING | Needs Subham contract |
| 8 | Envelope + Step context | PENDING | Needs Subham contract |
| 9 | Authority Lease scope validation | PENDING | Needs Subham contract |
| 10 | Continuity / recovery claimant | PENDING | Needs Shompod contract |
| 11 | Duplicate Claimant Test | DONE | src/gate01/checks/duplicate-claimant.js |
| 12 | Revocation, DENY, QUARANTINE | DONE | evaluator + constants |
| 13 | Stable reason codes | DONE | src/gate01/constants.js |
| 14 | Fail-closed behavior | DONE | evaluator |
| 15 | Versioned decision contracts | DONE | admission.js |
| 16 | Real backend events | DONE | src/gate01/events.js |

## Summary

- DONE: 7
- PENDING: 9
- Blocked on: Shompod (5 contracts), Subham (6 contracts)

## System Laws Enforced

- Identity ≠ Runtime
- Identity ≠ Entitlement
- Validation ≠ Authorization
- Binding ≠ Authority Lease
- Authority Lease ≠ Execution