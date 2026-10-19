// ############################################################
// #                ACELOGIC PLATFORM v4                      #
// ############################################################
// # Module        : NAMESPACE
// # Environment   : Development
// # Version       : 4.0.1
// # Updated       : 2026-05-15
// #
// # Purpose:
// # Symbolic namespace projection and deterministic
// # Kubernetes namespace validation utilities.
//
// # Responsibilities:
// # - symbolic namespace validation
// # - deterministic namespace projection
// # - Kubernetes namespace normalization
// # - execution boundary consistency
// # - namespace governance enforcement
// #
// ############################################################

// ------------------------------------------------------------------
// Symbolic Namespace Validation
// ------------------------------------------------------------------

/**
 * Validates whether a namespace belongs to the
 * ACELOGIC™ symbolic namespace hierarchy.
 */
export function isUsNamespace(ns) {

  return (
    typeof ns === 'string' &&
    ns.startsWith('#us#.')
  );
}

// ------------------------------------------------------------------
// Symbolic → Kubernetes Namespace Projection
// ------------------------------------------------------------------


export function projectUsNamespace(
  symbolicNamespace
) {

  if (!isUsNamespace(symbolicNamespace)) {
    throw new Error(
      'ACELOGIC_INVALID_SYMBOLIC_NAMESPACE'
    );
  }

  const projected =
    symbolicNamespace

      // Convert symbolic root
      .replace(/^#us#\./, 'us-')

      // Convert symbolic hierarchy separators
      .replace(/\./g, '-')

      // Remove unsupported characters
      .replace(/[^a-zA-Z0-9-]/g, '-')

      // Collapse repeated separators
      .replace(/-+/g, '-')

      // Kubernetes namespaces are lowercase
      .toLowerCase();

  // ----------------------------------------------------------------
  // Kubernetes namespace validation
  // ----------------------------------------------------------------

  if (
    !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(
      projected
    )
  ) {
    throw new Error(
      'ACELOGIC_INVALID_PROJECTED_K8S_NAMESPACE'
    );
  }

  // Kubernetes namespace max length = 63 chars

  if (projected.length > 63) {
    throw new Error(
      'ACELOGIC_PROJECTED_NAMESPACE_TOO_LONG'
    );
  }

  return projected;
}

// ------------------------------------------------------------------
// Namespace Projection Validation
// ------------------------------------------------------------------

/**
 * Validates deterministic equivalence between
 * symbolic namespaces and Kubernetes projections.
 */
export function validateNamespaceProjection(
  symbolicNamespace,
  k8sNamespace
) {

  return (
    projectUsNamespace(symbolicNamespace) ===
    k8sNamespace
  );
}

// ############################################################
// # End of File: namespace.js
// # Do not modify without code review
// ############################################################