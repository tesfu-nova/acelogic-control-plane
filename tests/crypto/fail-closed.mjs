// ############################################################
// #  FAIL-CLOSED ALGORITHM TESTS                             #
// #                                                          #
// #  Genesis emits uppercase ("SHA-256", "SHA3-256",         #
// #  "SHA3-512"). Legacy policies may carry lowercase.       #
// #  Both are accepted. Genuinely wrong values fail closed.  #
// ############################################################

import { evaluatePodAgainstPolicy } from '../../local-policy-evaluator/src/evaluator.js';

const pod = { metadata: { labels: {}, annotations: {} } };

function reasonFor(specOverrides) {
  return evaluatePodAgainstPolicy({
    pod,
    policy: { spec: { ...specOverrides } }
  }).reason;
}

let pass = 0, fail = 0;

function expect(name, actual, predicate) {
  const ok = predicate(actual);
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) {
    console.log(`     got: ${actual}`);
    fail++;
  } else {
    pass++;
  }
}

console.log('\n=== FAIL-CLOSED ALGORITHM TESTS ===\n');

// --- Genesis casing MUST be accepted ---
expect(
  'Genesis casing SHA-256 / SHA3-256 accepted',
  reasonFor({ fingerprintAlgorithm: 'SHA-256', purposeHashAlgorithm: 'SHA3-256' }),
  (r) => r !== 'ACELOGIC_UNSUPPORTED_FINGERPRINT_ALGORITHM'
      && r !== 'ACELOGIC_UNSUPPORTED_PURPOSE_HASH_ALGORITHM'
);

// --- Legacy lowercase MUST still be accepted ---
expect(
  'Legacy casing sha256 / sha3-256 accepted',
  reasonFor({ fingerprintAlgorithm: 'sha256', purposeHashAlgorithm: 'sha3-256' }),
  (r) => r !== 'ACELOGIC_UNSUPPORTED_FINGERPRINT_ALGORITHM'
      && r !== 'ACELOGIC_UNSUPPORTED_PURPOSE_HASH_ALGORITHM'
);

// --- Genuinely wrong values MUST be rejected ---
expect(
  'sha512 fingerprint rejected',
  reasonFor({ fingerprintAlgorithm: 'sha512', purposeHashAlgorithm: 'SHA3-256' }),
  (r) => r === 'ACELOGIC_UNSUPPORTED_FINGERPRINT_ALGORITHM'
);

expect(
  'SHA3-512 as purpose rejected',
  reasonFor({ fingerprintAlgorithm: 'SHA-256', purposeHashAlgorithm: 'SHA3-512' }),
  (r) => r === 'ACELOGIC_UNSUPPORTED_PURPOSE_HASH_ALGORITHM'
);

expect(
  'missing fingerprint rejected',
  reasonFor({ purposeHashAlgorithm: 'SHA3-256' }),
  (r) => r === 'ACELOGIC_UNSUPPORTED_FINGERPRINT_ALGORITHM'
);

expect(
  'missing purpose rejected',
  reasonFor({ fingerprintAlgorithm: 'SHA-256' }),
  (r) => r === 'ACELOGIC_UNSUPPORTED_PURPOSE_HASH_ALGORITHM'
);

expect(
  'md5 fingerprint rejected',
  reasonFor({ fingerprintAlgorithm: 'md5', purposeHashAlgorithm: 'SHA3-256' }),
  (r) => r === 'ACELOGIC_UNSUPPORTED_FINGERPRINT_ALGORITHM'
);

console.log('');
console.log(`  PASS: ${pass}`);
console.log(`  FAIL: ${fail}`);
console.log('');

if (fail > 0) process.exit(1);
console.log('  ✅ ALL FAIL-CLOSED TESTS PASS');