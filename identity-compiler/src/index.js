// ############################################################
// #                ACELOGIC PLATFORM v4                      #
// ############################################################
// # Module        : INDEX
// # Version       : 4.5.0
// # Updated       : 2026-10-08
// # Prepared by   : Tesfu — ACELOGIC Control Plane Lead
// ############################################################

export {
  compileAgent,
  buildIdentityPayloadFromInput,
  buildPurposePayloadFromInput,
  buildCovenantPayloadFromInput,
  buildIdentityMetadata
} from './compiler.js';

export {
  canonicalize,
  canonicalJson
} from './canonicalize.js';

export {
  computeCanonicalHash,
  computeFingerprint,
  computePurposeHash,
  computeCovenantHash,
  verifyDigitalFingerprintMetadata,
  verifyDigitalFingerprintHash,
  buildDigitalFingerprintMetadata,
  buildIdentityPayloadV1,
  buildPurposePayloadV1,
  buildCovenantPayloadV1,
  buildPurposeMetadata,
  buildCovenantMetadata,

  // crypto.createHash() arguments — lowercase
  FINGERPRINT_HASH_ARG,
  PURPOSE_HASH_ARG,
  COVENANT_HASH_ARG,

  // Metadata labels — uppercase, matches Genesis
  FINGERPRINT_ALGORITHM,
  PURPOSE_HASH_ALGORITHM,
  COVENANT_ALGORITHM,

  FINGERPRINT_DOMAIN,
  PURPOSE_DOMAIN,
  COVENANT_DOMAIN,
  IDENTITY_SCHEMA,
  PURPOSE_SCHEMA,
  COVENANT_SCHEMA,
  CVR_SCHEMA,
  PAYLOAD_VERSION,
  ENCODING,
  FINGERPRINT_VERSION,
  DIGITAL_FINGERPRINT_RENDERER,
  DIGITAL_FINGERPRINT_VERSION
} from './hash.js';

export {
  projectUsNamespace,
  validateNamespaceProjection,
  isUsNamespace
} from './namespace.js';

export {
  validateGrammarAccess,
  validateCovenantRules,
  normalizeGrammarLicense,
  tierNumber
} from './license.js';

// ############################################################
// # End of File: index.js
// ############################################################