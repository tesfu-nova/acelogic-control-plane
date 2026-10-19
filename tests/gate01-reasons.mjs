import { allowed, denied, quarantined, buildReason }
  from '../local-policy-evaluator/src/gate01/reasons.js';

const a = allowed('identity', { acelogic_id: 'ACE-001' });
const d = denied('identity', 'ACELOGIC_FINGERPRINT_MISMATCH', { expected: '0x...' });
const q = quarantined('claimant', 'ACELOGIC_DUPLICATE_CLAIMANT_DETECTED', { conflicting: ['RTI-002'] });
const r = buildReason('ACELOGIC_APPROVED', { ok: true }, { check: 'identity' });

console.log('allowed:', a.allowed === true && a.decision === 'ALLOW' ? 'PASS' : 'FAIL');
console.log('denied:', d.allowed === false && d.decision === 'DENY' ? 'PASS' : 'FAIL');
console.log('quarantined:', q.allowed === false && q.decision === 'QUARANTINE' ? 'PASS' : 'FAIL');
console.log('buildReason:', r.reason_code === 'ACELOGIC_APPROVED' ? 'PASS' : 'FAIL');