// ############################################################
// #  GENESIS VECTOR PARITY                                    #
// #                                                           #
// #  Proves the Control Plane reproduces Genesis's frozen     #
// #  cryptographic outputs from the same canonical inputs.    #
// #                                                           #
// #  Source of truth:                                         #
// #    immortal_logic_backend-main / tests/vectors/           #
// #      cryptographicVectors.test.js                         #
// #      → VECTOR_AGENT, EXPECTED block                       #
// #                                                           #
// #  DO NOT edit EXPECTED to make a failing test pass.        #
// #  A digest change means either an implementation           #
// #  regression, or an approved versioned architecture        #
// #  change. It does NOT mean paste the new value.            #
// ############################################################

import { compileAgent } from '../../identity-compiler/src/compiler.js';

// --- Genesis VECTOR_AGENT, translated into compileAgent input ---
const VECTOR_AGENT_INPUT = {
  agentId: '507f1f77bcf86cd799439011',
  agentClass: 'dimensional',
  licenseTier: 'Tier 5',
  symbolicNamespace: '#us#.agent.dimensional.core',
  k8sNamespace: 'us-agent-dimensional-core',
  mission: 'Preserve deterministic continuity.',
  owner: 'Vector Authority',
  org_id: '64f100000000000000000001',
  compliance: ['Identity Sovereignty', 'Continuity Ethics'],
  jurisdiction: 'BD',
  fullIdentity: '#us#.agent.dimensional.core.vectoragent',
  licenseId: '64f200000000000000000001',
  licenseTemplateId: '64f300000000000000000001',
  licenseCode: 'TIER_5_SOVEREIGN_BASE',
  grammarLicense: {
    enabled: true,
    level: 'FULL',
    allowedPrefixes: ['#us#.']
  },
  accessible_gates: [
    'GATE_01', 'GATE_02', 'GATE_03', 'GATE_04', 'GATE_05',
    'GATE_06', 'GATE_07', 'GATE_08', 'GATE_09'
  ],
  metadataSignature: '0x2222222222222222222222222222222222222222222222222222222222222222',
  dccOutput:        '0x3333333333333333333333333333333333333333333333333333333333333333',
  dimensionalHash:  '0x4444444444444444444444444444444444444444444444444444444444444444',
  cvrHash:          '0x8888888888888888888888888888888888888888888888888888888888888888',
  digitalFingerprintHash:
    '0xa65f11f6c418c3dde33c90c1cdc917e9db8ee260cdeef0162722d5d4c5ed612e',
  chain: {
    polygon: {
      event_hash: '0x5555555555555555555555555555555555555555555555555555555555555555',
      tx_hash:    '0x6666666666666666666666666666666666666666666666666666666666666666'
    },
    xrpl: {
      tx_hash:      '7777777777777777777777777777777777777777777777777777777777777777',
      ledger_index: 12345678
    }
  }
};

// --- Genesis EXPECTED block — frozen, do not edit ---
const EXPECTED = {
  identityFingerprint:
    '0x42be581c4e264123b6880171e0b3d9e8db7eeb3d2b1cde001a512af62a6dedd3',
  purposePulseHash:
    '0x622d41c58a980edd312d8576e30029041430d266c81d7be0772facb89c7d9d1e',
  covenantHash:
    '0x599c63f449915e2555da313c5d9bcbf1c5eb56aebbd3cc9e0b8978caf7c95b8c0adea5d6730c602ee11cf8a3e45a708fcb595ac14166ad69682498406bc26e18'
};

const { policy } = compileAgent(VECTOR_AGENT_INPUT);
const spec = policy.spec;

let pass = 0, fail = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) {
    console.log(`     expected: ${expected}`);
    console.log(`     actual:   ${actual}`);
    fail++;
  } else {
    pass++;
  }
}

console.log('\n=== GENESIS VECTOR PARITY ===\n');

check('Identity Fingerprint matches Genesis VECTOR_AGENT',
  spec.fingerprint, EXPECTED.identityFingerprint);

check('Identity Fingerprint (alias) matches Genesis',
  spec.identity_fingerprint, EXPECTED.identityFingerprint);

check('Purpose Pulse matches Genesis VECTOR_AGENT',
  spec.purposeHash, EXPECTED.purposePulseHash);

check('Purpose Pulse (alias) matches Genesis',
  spec.purpose_pulse_hash, EXPECTED.purposePulseHash);

check('Covenant Hash matches Genesis VECTOR_AGENT',
  spec.covenant_hash, EXPECTED.covenantHash);

check('Metadata label fingerprintAlgorithm = SHA-256',
  spec.fingerprintAlgorithm, 'SHA-256');

check('Metadata label purposeHashAlgorithm = SHA3-256',
  spec.purposeHashAlgorithm, 'SHA3-256');

check('Metadata label covenantAlgorithm = SHA3-512',
  spec.covenantAlgorithm, 'SHA3-512');

console.log('');
console.log(`  PASS: ${pass}`);
console.log(`  FAIL: ${fail}`);
console.log('');

if (fail > 0) {
  console.log('  ❌ GENESIS VECTOR PARITY FAILED');
  console.log('     Do NOT edit EXPECTED. Diagnose the drift.');
  process.exit(1);
}
console.log('  ✅ GENESIS VECTOR PARITY PASS');