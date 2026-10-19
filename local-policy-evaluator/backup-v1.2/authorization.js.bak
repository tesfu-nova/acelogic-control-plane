import crypto from 'crypto';

import { canonicalJson } from '../../../identity-compiler/src/index.js';

const SIGNING_KEY_ID = 'kid_acelogic_cp_v1';
const SIGNING_KEY = 'acelogic-control-plane-signing-key-v1'; 
const AUTH_DOMAIN = 'ACELOGIC:AUTHORIZATION:v1';
const AUTH_TTL_MS = 5 * 60 * 1000;

export function mintAuthorization({ request_hash, scope }) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + AUTH_TTL_MS);
  const authorization_id = `authz_${crypto.randomBytes(12).toString('hex')}`;

  const payload = {
    authorization_id,
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    algorithm: 'SHA-256',
    signing_key_id: SIGNING_KEY_ID,
    domain: AUTH_DOMAIN,
    request_hash,
    scope
  };

  const dataToSign = `${AUTH_DOMAIN}\n${canonicalJson(payload)}`;
  const signature = '0x' + crypto
    .createHmac('sha256', SIGNING_KEY)
    .update(dataToSign, 'utf8')
    .digest('hex');

  return { ...payload, signature };
}