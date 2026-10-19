// ############################################################
// #                ACELOGIC PLATFORM v4                      #
// # Module        : EVALUATOR                                #
// # Version       : 4.6.0                                    #
// ############################################################

import {
  computeFingerprint,
  computePurposeHash,
  computeCovenantHash,
  verifyDigitalFingerprintMetadata,
  verifyDigitalFingerprintHash,
  FINGERPRINT_HASH_ARG,
  PURPOSE_HASH_ARG,
  COVENANT_HASH_ARG
} from '../../identity-compiler/src/index.js';

function hasGate9(spec) {
  const gates = spec.accessible_gates || spec.completed_gates || spec.gate_codes || [];
  return Array.isArray(gates) && gates.includes('GATE_09');
}

function normalizeAlgorithm(value) {
  const collapsed = String(value || '').trim().toLowerCase().replace(/-/g, '');
  if (collapsed === 'sha256') return 'sha256';
  if (collapsed === 'sha3256') return 'sha3-256';
  if (collapsed === 'sha3512') return 'sha3-512';
  return collapsed;
}

export function evaluatePodAgainstPolicy({ pod, policy }) {
  if (!policy) return { allowed: false, reason: 'ACELOGIC_MISSING_POLICY' };
  if (!policy.spec || typeof policy.spec !== 'object') return { allowed: false, reason: 'ACELOGIC_MISSING_POLICY' };

  const labels = pod?.metadata?.labels || {};
  const annotations = pod?.metadata?.annotations || {};
  const spec = policy.spec;

  if (normalizeAlgorithm(spec.fingerprintAlgorithm) !== FINGERPRINT_HASH_ARG) {
    return { allowed: false, reason: 'ACELOGIC_UNSUPPORTED_FINGERPRINT_ALGORITHM' };
  }
  if (normalizeAlgorithm(spec.purposeHashAlgorithm) !== PURPOSE_HASH_ARG) {
    return { allowed: false, reason: 'ACELOGIC_UNSUPPORTED_PURPOSE_HASH_ALGORITHM' };
  }
  if (spec.covenantAlgorithm && normalizeAlgorithm(spec.covenantAlgorithm) !== COVENANT_HASH_ARG) {
    return { allowed: false, reason: 'ACELOGIC_UNSUPPORTED_COVENANT_ALGORITHM' };
  }

  if (!labels['acelogic.ai/agent-id']) return { allowed: false, reason: 'ACELOGIC_IDENTITY_MISSING' };
  if (labels['acelogic.ai/agent-id'] !== spec.agentId) return { allowed: false, reason: 'ACELOGIC_AGENT_ID_MISMATCH' };

  if (annotations['acelogic.ai/symbolic-namespace'] !== spec.symbolicNamespace) {
    return { allowed: false, reason: 'ACELOGIC_SYMBOLIC_NAMESPACE_MISMATCH' };
  }
  if (typeof spec.symbolicNamespace !== 'string' || !spec.symbolicNamespace.startsWith('#us#.')) {
    return { allowed: false, reason: 'ACELOGIC_INVALID_SYMBOLIC_NAMESPACE' };
  }

  const suppliedPurposeHash = annotations['acelogic.ai/purpose-hash'];
  const expectedPurposeHash = spec.purposeHash || spec.purpose_pulse_hash;
  if (!spec.purposePayload) return { allowed: false, reason: 'ACELOGIC_MISSING_PURPOSE_PAYLOAD' };
  const computedPurposeHash = computePurposeHash({ purposePayload: spec.purposePayload });
  if (suppliedPurposeHash !== expectedPurposeHash || suppliedPurposeHash !== computedPurposeHash) {
    return { allowed: false, reason: 'ACELOGIC_PURPOSE_PULSE_MISMATCH' };
  }

  const expectedFingerprint = spec.fingerprint || spec.identity_fingerprint;
  if (!spec.identityPayload) return { allowed: false, reason: 'ACELOGIC_MISSING_IDENTITY_PAYLOAD' };
  const recomputedFingerprint = computeFingerprint({ identityPayload: spec.identityPayload });
  if (recomputedFingerprint !== expectedFingerprint) {
    return { allowed: false, reason: 'ACELOGIC_FINGERPRINT_MISMATCH' };
  }

  if (spec.digital_fingerprint_metadata) {
    const metaCheck = verifyDigitalFingerprintMetadata(spec.digital_fingerprint_metadata);
    if (!metaCheck.valid) return { allowed: false, reason: metaCheck.reason };
  }
  if (spec.digital_fingerprint_hash) {
    const hashCheck = verifyDigitalFingerprintHash(spec.digital_fingerprint_hash);
    if (!hashCheck.valid) return { allowed: false, reason: hashCheck.reason };
  }

  if (hasGate9(spec)) {
    const expectedCovenant = spec.covenant_hash || spec.covenantHash;
    if (!expectedCovenant) return { allowed: false, reason: 'ACELOGIC_COVENANT_REQUIRED_FOR_GATE_9' };
    if (!spec.covenantPayload) return { allowed: false, reason: 'ACELOGIC_MISSING_COVENANT_PAYLOAD' };
    const recomputedCovenant = computeCovenantHash({ covenantPayload: spec.covenantPayload });
    if (recomputedCovenant !== expectedCovenant) return { allowed: false, reason: 'ACELOGIC_COVENANT_MISMATCH' };
  } else if (spec.covenant_hash || spec.covenantHash) {
    return { allowed: false, reason: 'ACELOGIC_COVENANT_NOT_ALLOWED_BELOW_GATE_9' };
  }

  if (!spec.state) return { allowed: false, reason: 'ACELOGIC_IDENTITY_MISSING' };
  if (spec.state !== 'ACTIVE') return { allowed: false, reason: `ACELOGIC_STATE_${spec.state}` };

  return { allowed: true, reason: 'ACELOGIC_APPROVED' };
}