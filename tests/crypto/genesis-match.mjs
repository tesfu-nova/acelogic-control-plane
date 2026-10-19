import { computeCanonicalHash } from '../../identity-compiler/src/index.js';

const testHash = computeCanonicalHash({
  algorithm: 'sha256',
  domain: 'ACELOGIC:BIRTH:IDENTITY:v1',
  payload: { schema: 'acelogic.identity.v1', acelogic_id: 'TEST-001' }
});

console.log('Hash:', testHash);
console.log('Length:', testHash.length);
console.log('Format (0x + 64 hex):',
  /^0x[a-f0-9]{64}$/.test(testHash) ? 'PASS' : 'FAIL');
console.log('Length check (66):',
  testHash.length === 66 ? 'PASS' : 'FAIL');

const testPurpose = computeCanonicalHash({
  algorithm: 'sha3-256',
  domain: 'ACELOGIC:BIRTH:PURPOSE:v1',
  payload: { schema: 'acelogic.purpose.v1', acelogic_id: 'TEST-001' }
});

console.log('');
console.log('Purpose:', testPurpose);
console.log('Format:',
  /^0x[a-f0-9]{64}$/.test(testPurpose) ? 'PASS' : 'FAIL');