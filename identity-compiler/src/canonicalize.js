// ############################################################
// #                ACELOGIC PLATFORM v4                      #
// ############################################################
// # Module        : CANONICALIZE
// # Version       : 4.0.5
// # Updated       : 2026-09-19
// #
// ############################################################

export function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      if (value[key] !== undefined) {
        result[key] = canonicalize(value[key]);
      }
      return result;
    }, {});
}

export function canonicalJson(payload) {
  return JSON.stringify(canonicalize(payload));
}

// ############################################################
// # End of File: canonicalize.js
// ############################################################