import fs from 'fs';
import crypto from 'crypto';
import { canonicalJson } from '../identity-compiler/src/index.js';

const body = JSON.parse(fs.readFileSync('./test-request-valid.json', 'utf8'));
delete body.request_hash;

const input = 'ACELOGIC:REQUEST:v1\n' + canonicalJson(body);
const hash = '0x' + crypto.createHash('sha256').update(input, 'utf8').digest('hex');

console.log('Request hash:', hash);
console.log('Full request:', JSON.stringify({ ...body, request_hash: hash }, null, 2));