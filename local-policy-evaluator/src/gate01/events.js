// ############################################################
// #                ACELOGIC PLATFORM v4                      #
// # Module        : GATE01 / EVENTS                          #
// # Version       : 4.0.3                                    #
// # Updated       : 2026-10-03                               #
// # Prepared by   : Tesfu — ACELOGIC Control Plane Lead      #
// ############################################################

const listeners = [];

export function onDecisionEvent(handler) {
  listeners.push(handler);
}

export function emitDecisionEvent(decision, request) {
  const reasonCode =
    decision.reason_code ||
    decision.reason ||
    null;

  const now = new Date().toISOString();

  const event = {
    event_id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    event_version: '1.0',
    event_type: 'GATE_01_DECISION',
    emitted_at: now,
    timestamp: now,

    decision: decision.decision,
    reason_code: reasonCode,
    evidence: decision.evidence || {},

    correlation_id: request && request.correlation_id,
    tenant_id:
      request && request.organization && request.organization.tenant_id,
    organization_id:
      request && request.organization && request.organization.org_id,

    acelogic_id:
      request && request.identity && request.identity.acelogic_id,
    envelope_id:
      request && request.envelope && request.envelope.envelope_id,
    step_id: request && request.envelope && request.envelope.step_id,
    runtime_id:
      request && request.runtime && request.runtime.canonical_runtime_id,
    runtime_instance_id:
      request && request.runtime && request.runtime.runtime_instance_id,
    runtime_worker_id:
      request && request.runtime && request.runtime.runtime_worker_id,
    lease_id: request && request.lease && request.lease.lease_id,
    authority_lease_id:
      request && request.lease && request.lease.lease_id,

    evidence_ref: null,

    severity: decision.decision === 'ALLOW' ? 'INFO' : 'WARN',
    domain: 'ACELOGIC_CONTROL_PLANE'
  };

  for (const handler of listeners) {
    try {
      handler(event);
    } catch (err) {
      console.error(
        JSON.stringify({
          event: 'EVENT_HANDLER_ERROR',
          error: err.message,
          timestamp: new Date().toISOString()
        })
      );
    }
  }

  console.log(JSON.stringify(event));

  return event;
}

// ############################################################
// # End of File: events.js
// # Prepared by: Tesfu — ACELOGIC Control Plane Lead
// ############################################################