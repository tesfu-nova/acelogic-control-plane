// ############################################################
// #                ACELOGIC PLATFORM v4                      #
// ############################################################
// # Module        : LICENSE
// # Version       : 4.0.7
// # Updated       : 2026-10-04
// # Prepared by   : Tesfu — ACELOGIC Control Plane Lead
// #
// # Covenant is gated on Gate 9 authorization (accessible_gates),
// # NOT on licenseTier. Tier names are not gate definitions.
// # Gates 7-9 are higher-assurance additions and must not become
// # mandatory for Gates 1-6 agents.
// ############################################################

export function normalizeGrammarLicense(input) {
  if (!input) {
    return { enabled: false, level: null, allowedPrefixes: [] };
  }
  return {
    enabled: !!input.enabled,
    level: input.level || null,
    allowedPrefixes: Array.isArray(input.allowedPrefixes)
      ? input.allowedPrefixes
      : []
  };
}

export function validateGrammarAccess(symbolicNamespace, grammarLicense) {
  if (!symbolicNamespace?.startsWith('#us#.')) return true;
  if (!grammarLicense?.enabled) {
    throw new Error('ACELOGIC_GRAMMAR_LICENSE_DISABLED');
  }
  if (grammarLicense.level === 'FULL') return true;
  if (grammarLicense.level === 'RESTRICTED') {
    const allowed = (grammarLicense.allowedPrefixes || []).some(prefix =>
      symbolicNamespace.startsWith(prefix)
    );
    if (!allowed) {
      throw new Error('ACELOGIC_GRAMMAR_LICENSE_PREFIX_NOT_ALLOWED');
    }
    return true;
  }
  throw new Error('ACELOGIC_GRAMMAR_LICENSE_UNKNOWN_LEVEL');
}

/**
 * Validates covenant rules.
 *
 * COVENANT IS GATED ON GATE 9, NOT ON THE TIER NAME.
 *
 * - If GATE_09 is present in accessible_gates, covenant_hash is required.
 * - If GATE_09 is NOT present, covenant_hash is NOT allowed.
 * - Gates 1-6 do not require Gates 7-9 evidence.
 */
export function validateCovenantRules({ accessible_gates, covenantHash }) {
  const gates = Array.isArray(accessible_gates) ? accessible_gates : [];
  const hasGate9 = gates.includes('GATE_09');

  if (hasGate9 && !covenantHash) {
    throw new Error('ACELOGIC_GATE9_REQUIRES_COVENANT_HASH');
  }
  if (!hasGate9 && covenantHash) {
    throw new Error('ACELOGIC_COVENANT_HASH_NOT_ALLOWED_BELOW_GATE9');
  }
  return true;
}

export function tierNumber(licenseTier) {
  if (!licenseTier) return null;
  const match = String(licenseTier).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// ############################################################
// # End of File: license.js
// # Do not modify without code review
// ############################################################