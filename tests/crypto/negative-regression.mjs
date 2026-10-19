// ############################################################
// #  NEGATIVE REGRESSION TESTS                               #
// ############################################################
// # Verify the evaluator fails closed on:
// #   - Mutated identity field
// #   - Mutated purpose field
// #   - Wrong algorithm declaration
// #   - Wrong fingerprint for correct ID
// #   - Changed payload with old fingerprint
// #   - Invalid covenant hash
// #   - Covenant below Gate 9
// #   - Genesis casing accepted (positive control)
// ############################################################

import { evaluatePodAgainstPolicy } from '../../local-policy-evaluator/src/evaluator.js';

import {
  computeFingerprint,
  computePurposeHash
} from '../../identity-compiler/src/index.js';

const baseIdentityPayload = {
  schema: 'acelogic.identity.v1',
  acelogic_id: 'ACE-NEG-001',
  org_id: 'org-neg',
  agent_class: 'ENTERPRISE_AGENT',
  namespace: '#us#.neg.test',
  full_identity: null,
  owner: { name: null },
  license_birth: {
    issued_license_id: null,
    template_id: null,
    code: null,
    tier: null
  }
};

const basePurposePayload = {
  schema: 'acelogic.purpose.v1',
  acelogic_id: 'ACE-NEG-001',
  mission: 'Negative regression mission',
  agent_class: 'ENTERPRISE_AGENT',
  compliance: null,
  jurisdiction: null
};

const correctFingerprint = computeFingerprint({ identityPayload: baseIdentityPayload });
const correctPurposeHash = computePurposeHash({ purposePayload: basePurposePayload });

function makePod() {
  return {
    metadata: {
      namespace: 'us-neg-test',
      labels: {
        'acelogic.ai/agent-id': 'ACE-NEG-001'
      },
      annotations: {
        'acelogic.ai/symbolic-namespace': '#us#.neg.test',
        'acelogic.ai/purpose-hash': correctPurposeHash
      }
    }
  };
}

function makePolicy(overrides = {}) {
  return {
    spec: {
      agentId: 'ACE-NEG-001',
      symbolicNamespace: '#us#.neg.test',
      k8sNamespace: 'us-neg-test',

      fingerprintAlgorithm: 'SHA-256',
      purposeHashAlgorithm: 'SHA3-256',
      covenantAlgorithm: 'SHA3-512',

      fingerprint: correctFingerprint,
      identity_fingerprint: correctFingerprint,
      purposeHash: correctPurposeHash,
      purpose_pulse_hash: correctPurposeHash,

      identityPayload: baseIdentityPayload,
      purposePayload: basePurposePayload,

      accessible_gates: ['GATE_01'],
      grammarLicense: { enabled: true, level: 'FULL' },
      state: 'ACTIVE',

      lease: { expiresAt: '2099-12-31T00:00:00Z' },

      ...overrides
    }
  };
}

console.log('\n=== NEGATIVE REGRESSION TESTS ===\n');

let pass = 0, fail = 0;

function check(name, result, expectedReason) {
  const ok = result.allowed === false && result.reason === expectedReason;
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) {
    console.log(`     expected: allowed=false, reason=${expectedReason}`);
    console.log(`     got:      allowed=${result.allowed}, reason=${result.reason}`);
    fail++;
  } else {
    pass++;
  }
}

function checkAllow(name, result) {
  const ok = result.allowed === true;
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) {
    console.log(`     expected: allowed=true`);
    console.log(`     got:      allowed=${result.allowed}, reason=${result.reason}`);
    fail++;
  } else {
    pass++;
  }
}

// ------------------------------------------------------------------
// Test 1 — Mutated identity field → fingerprint no longer verifies
// ------------------------------------------------------------------
const mutatedIdentity = { ...baseIdentityPayload, org_id: 'org-DIFFERENT' };
const mutatedPolicy = makePolicy({
  identityPayload: mutatedIdentity,
  fingerprint: correctFingerprint,
  identity_fingerprint: correctFingerprint
});
check(
  'Mutated identity field → ACELOGIC_FINGERPRINT_MISMATCH',
  evaluatePodAgainstPolicy({ pod: makePod(), policy: mutatedPolicy }),
  'ACELOGIC_FINGERPRINT_MISMATCH'
);

// ------------------------------------------------------------------
// Test 2 — Mutated purpose field → purpose pulse no longer verifies
// ------------------------------------------------------------------
const mutatedPurpose = { ...basePurposePayload, mission: 'TAMPERED' };
const mutatedPurposePolicy = makePolicy({
  purposePayload: mutatedPurpose,
  purposeHash: correctPurposeHash,
  purpose_pulse_hash: correctPurposeHash
});
check(
  'Mutated purpose field → ACELOGIC_PURPOSE_PULSE_MISMATCH',
  evaluatePodAgainstPolicy({ pod: makePod(), policy: mutatedPurposePolicy }),
  'ACELOGIC_PURPOSE_PULSE_MISMATCH'
);

// ------------------------------------------------------------------
// Test 3 — Unsupported fingerprint algorithm → fail closed
// ------------------------------------------------------------------
const wrongFpAlgoPolicy = makePolicy({ fingerprintAlgorithm: 'sha512' });
check(
  'Unsupported fingerprintAlgorithm (sha512) → ACELOGIC_UNSUPPORTED_FINGERPRINT_ALGORITHM',
  evaluatePodAgainstPolicy({ pod: makePod(), policy: wrongFpAlgoPolicy }),
  'ACELOGIC_UNSUPPORTED_FINGERPRINT_ALGORITHM'
);

// ------------------------------------------------------------------
// Test 4 — Unsupported purpose algorithm → fail closed
// ------------------------------------------------------------------
const wrongPurposeAlgoPolicy = makePolicy({ purposeHashAlgorithm: 'sha512' });
check(
  'Unsupported purposeHashAlgorithm → ACELOGIC_UNSUPPORTED_PURPOSE_HASH_ALGORITHM',
  evaluatePodAgainstPolicy({ pod: makePod(), policy: wrongPurposeAlgoPolicy }),
  'ACELOGIC_UNSUPPORTED_PURPOSE_HASH_ALGORITHM'
);

// ------------------------------------------------------------------
// Test 5 — Correct ID + different agent's fingerprint → DENY
// ------------------------------------------------------------------
const wrongFingerprintPolicy = makePolicy({
  fingerprint: '0x' + 'a'.repeat(64),
  identity_fingerprint: '0x' + 'a'.repeat(64)
});
check(
  'Correct ID + different fingerprint → ACELOGIC_FINGERPRINT_MISMATCH',
  evaluatePodAgainstPolicy({ pod: makePod(), policy: wrongFingerprintPolicy }),
  'ACELOGIC_FINGERPRINT_MISMATCH'
);

// ------------------------------------------------------------------
// Test 6 — Changed payload + old fingerprint → DENY
// ------------------------------------------------------------------
const changedPayload = {
  ...baseIdentityPayload,
  namespace: '#us#.DIFFERENT.namespace'
};
const changedPayloadPolicy = makePolicy({
  identityPayload: changedPayload,
  fingerprint: correctFingerprint,
  identity_fingerprint: correctFingerprint,
  symbolicNamespace: '#us#.DIFFERENT.namespace'
});
const changedPod = {
  metadata: {
    namespace: 'us-neg-test',
    labels: { 'acelogic.ai/agent-id': 'ACE-NEG-001' },
    annotations: {
      'acelogic.ai/symbolic-namespace': '#us#.DIFFERENT.namespace',
      'acelogic.ai/purpose-hash': correctPurposeHash
    }
  }
};
check(
  'Changed payload + old fingerprint → ACELOGIC_FINGERPRINT_MISMATCH',
  evaluatePodAgainstPolicy({ pod: changedPod, policy: changedPayloadPolicy }),
  'ACELOGIC_FINGERPRINT_MISMATCH'
);

// ------------------------------------------------------------------
// Test 7 — Invalid SHA3-512 covenant → DENY (Gate 9)
// ------------------------------------------------------------------
const invalidCovenantPolicy = makePolicy({
  accessible_gates: ['GATE_01', 'GATE_09'],
  covenantAlgorithm: 'SHA3-512',
  covenant_hash: '0x' + 'b'.repeat(128),
  covenantPayload: {
    schema: 'acelogic.covenant.v1',
    acelogic_id: 'ACE-NEG-001',
    identity_fingerprint: correctFingerprint,
    purpose_pulse_hash: correctPurposeHash,
    digital_fingerprint_hash: null,
    metadata_signature: null,
    dcc_output: null,
    dimensional_hash: null,
    continuity: {
      cvr_hash: null,
      polygon_event_hash: null,
      polygon_tx_hash: null,
      xrpl_tx_hash: null,
      xrpl_ledger_index: null
    },
    governance: {
      org_id: 'org-neg',
      license_id: null,
      license_tier: null,
      compliance: null,
      jurisdiction: null
    },
    covenant_version: '1.0'
  }
});
check(
  'Invalid covenant hash for Gate 9 → ACELOGIC_COVENANT_MISMATCH',
  evaluatePodAgainstPolicy({ pod: makePod(), policy: invalidCovenantPolicy }),
  'ACELOGIC_COVENANT_MISMATCH'
);

// ------------------------------------------------------------------
// Test 8 — Covenant provided without Gate 9 → DENY
// ------------------------------------------------------------------
const covenantBelowGate9 = makePolicy({
  accessible_gates: ['GATE_01'],
  covenant_hash: '0x' + 'c'.repeat(128)
});
check(
  'Covenant below Gate 9 → ACELOGIC_COVENANT_NOT_ALLOWED_BELOW_GATE_9',
  evaluatePodAgainstPolicy({ pod: makePod(), policy: covenantBelowGate9 }),
  'ACELOGIC_COVENANT_NOT_ALLOWED_BELOW_GATE_9'
);

// ------------------------------------------------------------------
// Test 9 — Genesis casing is ACCEPTED (positive control)
// ------------------------------------------------------------------
const genesisCasingPolicy = makePolicy({
  fingerprintAlgorithm: 'SHA-256',
  purposeHashAlgorithm: 'SHA3-256',
  covenantAlgorithm: 'SHA3-512'
});
checkAllow(
  'Genesis casing (SHA-256 / SHA3-256 / SHA3-512) accepted',
  evaluatePodAgainstPolicy({ pod: makePod(), policy: genesisCasingPolicy })
);

// ------------------------------------------------------------------
// Test 10 — Legacy lowercase casing is ACCEPTED (positive control)
// ------------------------------------------------------------------
const legacyCasingPolicy = makePolicy({
  fingerprintAlgorithm: 'sha256',
  purposeHashAlgorithm: 'sha3-256',
  covenantAlgorithm: 'sha3-512'
});
checkAllow(
  'Legacy casing (sha256 / sha3-256 / sha3-512) accepted',
  evaluatePodAgainstPolicy({ pod: makePod(), policy: legacyCasingPolicy })
);

console.log('');
console.log(`  PASS: ${pass}`);
console.log(`  FAIL: ${fail}`);
console.log('');

if (fail === 0) {
  console.log('  ✅ ALL NEGATIVE REGRESSION TESTS PASS');
} else {
  console.log(`  ❌ ${fail} TEST(S) FAILED`);
  process.exit(1);
}