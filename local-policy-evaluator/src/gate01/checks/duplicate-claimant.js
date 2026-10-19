// ############################################################
// #                ACELOGIC PLATFORM v4                      #
// # Module        : GATE01 / CHECK / DUPLICATE CLAIMANT      #
// # Version       : 4.0.2                                    #
// # Updated       : 2026-10-01  /recent                       #
// ############################################################

import { DECISION, REASON } from '../constants.js';

/**
 * Normalizes runtime identity fields from the request.
 *
 * Accepts two shapes:
 *   1. Request-shaped: { runtime: { canonical_runtime_id, runtime_instance_id } }
 *   2. Internal-shaped: { runtime_id, runtime_instance }
 */
function normalizeRuntime(ctx) {
  const canonicalRuntimeId =
    (ctx.runtime && ctx.runtime.canonical_runtime_id) ||
    (ctx.runtime_id && ctx.runtime_id.canonical_runtime_id) ||
    null;

  const runtimeInstanceId =
    (ctx.runtime && ctx.runtime.runtime_instance_id) ||
    (ctx.runtime_instance && ctx.runtime_instance.runtime_instance_id) ||
    null;

  return { canonicalRuntimeId, runtimeInstanceId };
}

export function checkDuplicateClaimant(ctx) {
  const cl = ctx.claimants || {};
  const identity = ctx.identity || {};
  const envelope = ctx.envelope || {};
  const { canonicalRuntimeId, runtimeInstanceId } = normalizeRuntime(ctx);

  const thisClaimant = cl.this_claimant_id;
  const activeClaimants = Array.isArray(cl.active_claimants)
    ? cl.active_claimants
    : [];

  // ------------------------------------------------------------------
  // Check 1 — Duplicate claimant for the same identity + envelope
  // ------------------------------------------------------------------
  const duplicateClaimants = activeClaimants.filter(
    (c) =>
      c.identity_id === identity.acelogic_id &&
      c.envelope_id === envelope.envelope_id &&
      c.claimant_id !== thisClaimant
  );

  if (duplicateClaimants.length > 0) {
    return {
      decision: DECISION.QUARANTINE,
      reason: REASON.DUPLICATE_DETECTED,
      evidence: {
        this_claimant_id: thisClaimant,
        acelogic_id: identity.acelogic_id,
        envelope_id: envelope.envelope_id,
        conflicting_claimants: duplicateClaimants.map(
          (c) => c.claimant_id
        ),
        detected_at: new Date().toISOString()
      }
    };
  }

  // ------------------------------------------------------------------
  // Check 2 — Conflicting runtime instance for the same Runtime ID
  // ------------------------------------------------------------------
  if (canonicalRuntimeId) {
    const conflictingRuntime = activeClaimants.filter(
      (c) =>
        c.runtime_id === canonicalRuntimeId &&
        c.runtime_instance_id !== runtimeInstanceId &&
        c.claimant_id !== thisClaimant
    );

    if (conflictingRuntime.length > 0) {
      return {
        decision: DECISION.QUARANTINE,
        reason: REASON.CONFLICTING_RUNTIME,
        evidence: {
          this_claimant_id: thisClaimant,
          canonical_runtime_id: canonicalRuntimeId,
          this_runtime_instance_id: runtimeInstanceId,
          conflicting_instances: conflictingRuntime.map(
            (c) => c.runtime_instance_id
          ),
          detected_at: new Date().toISOString()
        }
      };
    }
  }

  // ------------------------------------------------------------------
  // Clean
  // ------------------------------------------------------------------
  return {
    decision: DECISION.ALLOW,
    reason: REASON.CONTINUITY_VERIFIED,
    evidence: {
      this_claimant_id: thisClaimant,
      active_claimant_count: activeClaimants.length
    }
  };
}

// ############################################################
// # End of File: duplicate-claimant.js
// ############################################################