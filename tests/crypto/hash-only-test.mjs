import { computeCanonicalHash } from '../../identity-compiler/src/hash.js';

const hash = computeCanonicalHash({
  algorithm: 'sha256',
  domain: 'ACELOGIC:BIRTH:IDENTITY:v1',
  payload: { schema: 'acelogic.identity.v1', acelogic_id: 'TEST-001' }
});

console.log('Hash:', hash);
console.log('Length:', hash.length);
console.log('Format:', /^0x[a-f0-9]{64}$/.test(hash) ? 'PASS' : 'FAIL');
console.log('Length check:', hash.length === 66 ? 'PASS' : 'FAIL');