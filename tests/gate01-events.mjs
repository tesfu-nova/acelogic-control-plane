import { onDecisionEvent, emitDecisionEvent }
  from '../local-policy-evaluator/src/gate01/events.js';

let captured = null;
onDecisionEvent(e => { captured = e; });

const decision = {
  decision: 'ALLOW',
  reason: 'ACELOGIC_APPROVED',
  evidence: { checks_passed: ['identity'] }
};

const request = {
  correlation_id: 'test-001',
  organization: { org_id: 'org-1', tenant_id: 'tenant-1' },
  identity: { acelogic_id: 'ACE-001' },
  envelope: { envelope_id: 'ENV-001', step_id: 'STEP-01' },
  runtime: { canonical_runtime_id: 'RT-001', runtime_instance_id: 'RTI-001' },
  lease: { lease_id: 'LEASE-001' }
};

emitDecisionEvent(decision, request);

console.log('Event captured:', captured ? 'PASS' : 'FAIL');
console.log('Has correlation:', captured.correlation_id === 'test-001' ? 'PASS' : 'FAIL');
console.log('Has acelogic_id:', captured.acelogic_id === 'ACE-001' ? 'PASS' : 'FAIL');