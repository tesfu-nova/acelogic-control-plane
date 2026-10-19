// ############################################################
// # Module        : GATE01 / REASONS                         #
// ############################################################
// Builds structured reason objects with evidence references.
// Every decision output carries: reason, evidence, context.
// ############################################################

export function buildReason(code, evidence, context) {
  return {
    reason_code: code,
    evidence: evidence || {},
    context: context || {},
    recorded_at: new Date().toISOString()
  };
}

export function allowed(check, evidence) {
  return {
    allowed: true,
    decision: 'ALLOW',
    reason: 'ACELOGIC_APPROVED',
    check,
    evidence: evidence || {}
  };
}

export function denied(check, reason, evidence) {
  return {
    allowed: false,
    decision: 'DENY',
    reason,
    check,
    evidence: evidence || {}
  };
}

export function quarantined(check, reason, evidence) {
  return {
    allowed: false,
    decision: 'QUARANTINE',
    reason,
    check,
    evidence: evidence || {}
  };
}