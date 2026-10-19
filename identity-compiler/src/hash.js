// ############################################################
// #                ACELOGIC PLATFORM v4                      #
// ############################################################
// # Module        : HASH
// # Version       : 4.5.0
// # Updated       : 2026-10-08
// # Prepared by   : Tesfu - ACELOGIC Control Plane Lead
// #
// # Two distinct algorithm roles:
// #   *_HASH_ARG  - passed to crypto.createHash(), lowercase.
// #   *_ALGORITHM - metadata label, uppercase, matches Genesis.
// ############################################################

import crypto from 'crypto';
import { canonicalJson } from './canonicalize.js';

// crypto.createHash() arguments (lowercase)
export const FINGERPRINT_HASH_ARG = 'sha256';
export const PURPOSE_HASH_ARG = 'sha3-256';
export const COVENANT_HASH_ARG = 'sha3-512';

// Metadata labels (uppercase, Genesis contract)
export const FINGERPRINT_ALGORITHM = 'SHA-256';
export const PURPOSE_HASH_ALGORITHM = 'SHA3-256';
export const COVENANT_ALGORITHM = 'SHA3-512';

// Domain separators
export const FINGERPRINT_DOMAIN = 'ACELOGIC:BIRTH:IDENTITY:v1';
export const PURPOSE_DOMAIN = 'ACELOGIC:BIRTH:PURPOSE:v1';
export const COVENANT_DOMAIN = 'ACELOGIC:BIRTH:COVENANT:v1';

// Schemas
export const IDENTITY_SCHEMA = 'acelogic.identity.v1';
export const PURPOSE_SCHEMA = 'acelogic.purpose.v1';
export const COVENANT_SCHEMA = 'acelogic.covenant.v1';
export const CVR_SCHEMA = 'acelogic.cvr.v1';

export const PAYLOAD_VERSION = 'v1';
export const ENCODING = 'hex-lowercase';
export const FINGERPRINT_VERSION = 'v1';

// Digital Fingerprint constants
export const DIGITAL_FINGERPRINT_RENDERER = 'ACELOGIC-CIRCUIT-v1';
export const DIGITAL_FINGERPRINT_VERSION = 'ACELOGIC-DIGITAL-FP-v1';

// Core canonical hash
export function computeCanonicalHash({ algorithm, domain, payload }) {
  const canonicalPayload = canonicalJson(payload);
  const input = `${domain}\n${canonicalPayload}`;
  return (
    '0x' + crypto.createHash(algorithm).update(input, 'utf8').digest('hex')
  );
}

// Canonical payload builders
export function buildIdentityPayloadV1(doc) {
  return {
    schema: IDENTITY_SCHEMA,
    acelogic_id: doc.agentId?.toString() || doc._id?.toString(),
    org_id: doc.org_id || null,
    agent_class: doc.origin?.agent_class || null,
    namespace: doc.origin?.namespace || null,
    full_identity: doc.origin?.symbolic?.full_identity || null,
    owner: { name: doc.origin?.owner?.name || null },
    license_birth: {
      issued_license_id: doc.license_birth?.issued_license_id || null,
      template_id: doc.license_birth?.template_id || null,
      code: doc.license_birth?.code || null,
      tier: doc.license_birth?.tier || null
    }
  };
}

export function buildPurposePayloadV1(doc) {
  return {
    schema: PURPOSE_SCHEMA,
    acelogic_id: doc.agentId?.toString() || doc._id?.toString(),
    mission: doc.origin?.mission || null,
    agent_class: doc.origin?.agent_class || null,
    compliance: doc.metadata?.compliance || null,
    jurisdiction: doc.metadata?.owner?.jurisdiction || null
  };
}

export function buildCovenantPayloadV1(doc) {
  return {
    schema: COVENANT_SCHEMA,
    acelogic_id: doc.agentId?.toString() || doc._id?.toString(),
    identity_fingerprint: doc.identity_fingerprint,
    purpose_pulse_hash: doc.purpose_pulse_hash || doc.pulse_hash,
    digital_fingerprint_hash: doc.digital_fingerprint_hash,
    metadata_signature: doc.metadata_signature,
    dcc_output: doc.dcc_output,
    dimensional_hash: doc.dimensional_hash,
    continuity: {
      cvr_hash: doc.cvr_hash || doc.rvr_hash,
      polygon_event_hash: doc.chain?.polygon?.event_hash || null,
      polygon_tx_hash: doc.chain?.polygon?.tx_hash || null,
      xrpl_tx_hash: doc.chain?.xrpl?.tx_hash || null,
      xrpl_ledger_index: doc.chain?.xrpl?.ledger_index || null
    },
    governance: {
      org_id: doc.org_id || null,
      license_id: doc.license_birth?.issued_license_id || null,
      license_tier: doc.license_birth?.tier || null,
      compliance: doc.metadata?.compliance || null,
      jurisdiction: doc.metadata?.owner?.jurisdiction || null
    },
    covenant_version: '1.0'
  };
}

// Hash computation — uses *_HASH_ARG (lowercase)
export function computeFingerprint(arg) {
  const payload = arg.identityPayload || arg;
  return computeCanonicalHash({
    algorithm: FINGERPRINT_HASH_ARG,
    domain: FINGERPRINT_DOMAIN,
    payload
  });
}

export function computePurposeHash(arg) {
  const payload = arg.purposePayload || arg;
  return computeCanonicalHash({
    algorithm: PURPOSE_HASH_ARG,
    domain: PURPOSE_DOMAIN,
    payload
  });
}

export function computeCovenantHash(arg) {
  const payload = arg.covenantPayload || arg;
  return computeCanonicalHash({
    algorithm: COVENANT_HASH_ARG,
    domain: COVENANT_DOMAIN,
    payload
  });
}

// Digital Fingerprint — metadata and shape verification only
export function buildDigitalFingerprintMetadata() {
  return {
    source: 'identity_fingerprint',
    source_algorithm: FINGERPRINT_ALGORITHM,
    source_schema: IDENTITY_SCHEMA,
    source_payload_version: PAYLOAD_VERSION,
    renderer: DIGITAL_FINGERPRINT_RENDERER,
    version: DIGITAL_FINGERPRINT_VERSION
  };
}

export function verifyDigitalFingerprintMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return { valid: false, reason: 'ACELOGIC_MISSING_DIGITAL_FINGERPRINT_METADATA' };
  }
  if (metadata.source !== 'identity_fingerprint') {
    return { valid: false, reason: 'ACELOGIC_DIGITAL_FINGERPRINT_MISMATCH' };
  }
  if (metadata.source_algorithm !== FINGERPRINT_ALGORITHM) {
    return { valid: false, reason: 'ACELOGIC_DIGITAL_FINGERPRINT_MISMATCH' };
  }
  if (metadata.source_schema !== IDENTITY_SCHEMA) {
    return { valid: false, reason: 'ACELOGIC_DIGITAL_FINGERPRINT_MISMATCH' };
  }
  if (metadata.renderer !== DIGITAL_FINGERPRINT_RENDERER) {
    return { valid: false, reason: 'ACELOGIC_DIGITAL_FINGERPRINT_MISMATCH' };
  }
  return { valid: true };
}

export function verifyDigitalFingerprintHash(presentedHash) {
  if (!presentedHash || typeof presentedHash !== 'string') {
    return { valid: false, reason: 'ACELOGIC_DIGITAL_FINGERPRINT_MISMATCH' };
  }
  if (!presentedHash.startsWith('0x')) {
    return { valid: false, reason: 'ACELOGIC_DIGITAL_FINGERPRINT_MISMATCH' };
  }
  if (presentedHash.length !== 66) {
    return { valid: false, reason: 'ACELOGIC_DIGITAL_FINGERPRINT_MISMATCH' };
  }
  if (!/^0x[0-9a-f]{64}$/.test(presentedHash)) {
    return { valid: false, reason: 'ACELOGIC_DIGITAL_FINGERPRINT_MISMATCH' };
  }
  return { valid: true };
}

// Metadata descriptors
export function buildIdentityMetadataDescriptor() {
  return {
    algorithm: FINGERPRINT_ALGORITHM,
    schema: IDENTITY_SCHEMA,
    payload_version: PAYLOAD_VERSION,
    domain: FINGERPRINT_DOMAIN,
    encoding: ENCODING
  };
}

export function buildPurposeMetadataDescriptor() {
  return {
    algorithm: PURPOSE_HASH_ALGORITHM,
    schema: PURPOSE_SCHEMA,
    payload_version: PAYLOAD_VERSION,
    domain: PURPOSE_DOMAIN,
    encoding: ENCODING
  };
}

export function buildCovenantMetadataDescriptor() {
  return {
    algorithm: COVENANT_ALGORITHM,
    schema: COVENANT_SCHEMA,
    payload_version: PAYLOAD_VERSION,
    domain: COVENANT_DOMAIN,
    encoding: ENCODING
  };
}

export const buildIdentityMetadata = buildIdentityMetadataDescriptor;
export const buildPurposeMetadata  = buildPurposeMetadataDescriptor;
export const buildCovenantMetadata = buildCovenantMetadataDescriptor;
