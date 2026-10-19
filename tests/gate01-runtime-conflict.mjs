import { checkDuplicateClaimant }
  from '../local-policy-evaluator/src/gate01/checks/duplicate-claimant.js';

// Request-shaped object — matches what ACEPLACE will actually send
const request = {
  correlation_id: 'test-runtime-conflict-001',
  identity: {
    acelogic_id: 'ACE-TEST',
    namespace: '#us#.test.agent',
    mission: 'Test'
  },
  organization: {
    org_id: 'org-test',
    tenant_id: 'tenant-test'
  },
  runtime: {
    canonical_runtime_id: 'RT-TEST-001',
    runtime_instance_id: 'RTI-TEST-002'
  },
  envelope: {
    envelope_id: 'ENV-TEST-001',
    envelope_version: 1,
    step_id: 'STEP-01'
  },
  claimants: {
    this_claimant_id: 'RTI-TEST-002',
    active_claimants: [
      {
        runtime_id: 'RT-TEST-001',
        runtime_instance_id: 'RTI-TEST-OTHER',
        claimant_id: 'RTI-TEST-OTHER'
      }
    ]
  }
};

const result = checkDuplicateClaimant(request);

console.log('Decision:', result.decision);
console.log('Reason:', result.reason);
console.log('Conflicting instances:',
  result.evidence?.conflicting_instances || []);

const pass =
  result.decision === 'QUARANTINE' &&
  result.reason === 'ACELOGIC_CONFLICTING_RUNTIME_DETECTED';

console.log(pass ? 'PASS' : 'FAIL');