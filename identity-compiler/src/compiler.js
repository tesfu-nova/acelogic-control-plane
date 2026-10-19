// ############################################################
// #                ACELOGIC PLATFORM v4                      #
// ############################################################
// # Module        : COMPILER
// # Version       : 4.0.5
// # Updated       : 2026-09-19
// #
// ############################################################

import YAML from 'yaml';

import {
  computeFingerprint,
  computePurposeHash,
  computeCovenantHash,
  FINGERPRINT_ALGORITHM,
  PURPOSE_HASH_ALGORITHM,
  COVENANT_ALGORITHM,
  FINGERPRINT_VERSION,
  IDENTITY_SCHEMA,
  PURPOSE_SCHEMA,
  COVENANT_SCHEMA
} from './hash.js';

import { projectUsNamespace } from './namespace.js';

import {
  normalizeGrammarLicense,
  validateGrammarAccess,
  validateCovenantRules
} from './license.js';

function requireField(obj, key) {
  if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
    throw new Error(`ACELOGIC_MISSING_${key.toUpperCase()}`);
  }
}

function policyName(agentId) {
  return String(agentId)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');
}

// ------------------------------------------------------------------
// Canonical payload builders — single source of truth
// ------------------------------------------------------------------

export function buildIdentityPayloadFromInput(input) {
  return {
    schema: IDENTITY_SCHEMA,
    acelogic_id: input.agentId?.toString() || input._id?.toString() || null,
    org_id: input.org_id || null,
    agent_class: input.agentClass || null,
    namespace: input.symbolicNamespace || null,
    full_identity: input.fullIdentity || null,
    owner: {
      name:
        typeof input.owner === 'string'
          ? input.owner
          : input.owner?.displayName || input.owner?.name || null
    },
    license_birth: {
      issued_license_id: input.licenseId || null,
      template_id: input.licenseTemplateId || null,
      code: input.licenseCode || null,
      tier: input.licenseTier || null
    }
  };
}

export function buildPurposePayloadFromInput(input) {
  return {
    schema: PURPOSE_SCHEMA,
    acelogic_id: input.agentId?.toString() || input._id?.toString() || null,
    mission: input.mission || null,
    agent_class: input.agentClass || null,
    compliance: input.compliance || null,
    jurisdiction: input.jurisdiction || null
  };
}

export function buildCovenantPayloadFromInput(input, identityFP, purposePulse) {
  return {
    schema: COVENANT_SCHEMA,
    acelogic_id: input.agentId?.toString() || input._id?.toString() || null,
    identity_fingerprint: identityFP,
    purpose_pulse_hash: purposePulse,
    digital_fingerprint_hash: input.digitalFingerprintHash || null,
    metadata_signature: input.metadataSignature || null,
    dcc_output: input.dccOutput || null,
    dimensional_hash: input.dimensionalHash || null,
    continuity: {
      cvr_hash: input.cvrHash || null,
      polygon_event_hash: input.chain?.polygon?.event_hash || null,
      polygon_tx_hash: input.chain?.polygon?.tx_hash || null,
      xrpl_tx_hash: input.chain?.xrpl?.tx_hash || null,
      xrpl_ledger_index: input.chain?.xrpl?.ledger_index || null
    },
    governance: {
      org_id: input.org_id || null,
      license_id: input.licenseId || null,
      license_tier: input.licenseTier || null,
      compliance: input.compliance || null,
      jurisdiction: input.jurisdiction || null
    },
    covenant_version: '1.0'
  };
}

// ------------------------------------------------------------------
// compileAgent
// ------------------------------------------------------------------

export function compileAgent(input) {
  for (const key of ['agentId', 'licenseTier', 'symbolicNamespace', 'mission']) {
    requireField(input, key);
  }

  const grammarLicense = normalizeGrammarLicense(input.grammarLicense);
  validateGrammarAccess(input.symbolicNamespace, grammarLicense);

  const k8sNamespace =
    input.k8sNamespace || projectUsNamespace(input.symbolicNamespace);

  // 1. Build canonical payloads ONCE
  const identityPayload = buildIdentityPayloadFromInput(input);
  const purposePayload = buildPurposePayloadFromInput(input);

  // 2. Compute identity + purpose hashes
  const fingerprint = computeFingerprint({ identityPayload });
  const purposeHash = computePurposeHash({ purposePayload });

  // 3. Build covenant payload + hash if Gate 9 is authorized
  let covenantHash = null;
  let covenantPayload = null;
  const hasGate9 =
    Array.isArray(input.accessible_gates) &&
    input.accessible_gates.includes('GATE_09');

  if (hasGate9) {
    covenantPayload = buildCovenantPayloadFromInput(
      input,
      fingerprint,
      purposeHash
    );
    covenantHash = computeCovenantHash({ covenantPayload });
  }

  // 4. Validate covenant rules AFTER covenantHash is available
  validateCovenantRules({
    accessible_gates: input.accessible_gates || [],
    covenantHash: input.covenantHash || covenantHash
  });

  const now = input.lastUpdated || new Date().toISOString();

  const policy = {
    apiVersion: 'acelogic.ai/v1',
    kind: 'AgentIdentityPolicy',
    metadata: {
      name: policyName(input.agentId),
      namespace: input.policyNamespace || 'acelogic-system'
    },
    spec: {
      agentId: input.agentId,
      agentClass: input.agentClass || 'UNSPECIFIED',
      licenseTier: input.licenseTier,
      grammarLicense,
      symbolicNamespace: input.symbolicNamespace,
      k8sNamespace,
      mission: input.mission,
      owner: input.owner || null,
      org_id: input.org_id || null,
      compliance: input.compliance || null,
      jurisdiction: input.jurisdiction || null,
      full_identity: input.fullIdentity || null,
      license_birth: {
        issued_license_id: input.licenseId || null,
        template_id: input.licenseTemplateId || null,
        code: input.licenseCode || null,
        tier: input.licenseTier || null
      },

      fingerprintAlgorithm: FINGERPRINT_ALGORITHM,
      fingerprintVersion: FINGERPRINT_VERSION,
      purposeHashAlgorithm: PURPOSE_HASH_ALGORITHM,
      covenantAlgorithm: COVENANT_ALGORITHM,

      fingerprint,
      identity_fingerprint: fingerprint,
      purposeHash,
      purpose_pulse_hash: purposeHash,
      covenant_hash: covenantHash,

      identityPayload,
      purposePayload,
      covenantPayload,

      accessible_gates: input.accessible_gates || [],

      state: input.state || 'ACTIVE',
      lease: {
        epoch: input.epoch || 1,
        expiresAt:
          input.expiresAt ||
          new Date(Date.now() + 300_000).toISOString()
      },
      source: input.source || { origin: 'unknown', portal: null },
      lastUpdated: now
    }
  };

  return {
    policy,
    yaml: YAML.stringify(policy)
  };
}

// Backward-compatible alias
export { buildIdentityPayloadFromInput as buildIdentityMetadata };

// ############################################################
// # End of File: compiler.js
// ############################################################