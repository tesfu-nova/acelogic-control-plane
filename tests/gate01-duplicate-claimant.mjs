
  import { checkDuplicateClaimant }
  from '../local-policy-evaluator/src/gate01/checks/duplicate-claimant.js';

// Test 1 — clean
const clean = checkDuplicateClaimant({
  identity: { acelogic_id: 'ACE-001' },
  envelope: { envelope_id: 'ENV-001' },
  runtime_id: { canonical_runtime_id: 'RT-001' },
  runtime_instance: { runtime_instance_id: 'RTI-001' },
  claimants: {
    this_claimant_id: 'RTI-001',
    active_claimants: []
  }
});
console.log('Clean:', clean.decision === 'ALLOW' ? 'PASS' : 'FAIL');

// Test 2 — duplicate claimant
const duplicate = checkDuplicateClaimant({
  identity: { acelogic_id: 'ACE-001' },
  envelope: { envelope_id: 'ENV-001' },
  runtime_id: { canonical_runtime_id: 'RT-001' },
  runtime_instance: { runtime_instance_id: 'RTI-001' },
  claimants: {
    this_claimant_id: 'RTI-001',
    active_claimants: [
      { identity_id: 'ACE-001', envelope_id: 'ENV-001', claimant_id: 'RTI-002' }
    ]
  }
});
console.log('Duplicate:',
  duplicate.decision === 'QUARANTINE' ? 'PASS' : 'FAIL');

// Test 3 — conflicting runtime
const conflict = checkDuplicateClaimant({
  identity: { acelogic_id: 'ACE-001' },
  envelope: { envelope_id: 'ENV-001' },
  runtime_id: { canonical_runtime_id: 'RT-001' },
  runtime_instance: { runtime_instance_id: 'RTI-001' },
  claimants: {
    this_claimant_id: 'RTI-001',
    active_claimants: [
      { runtime_id: 'RT-001', runtime_instance_id: 'RTI-002', claimant_id: 'RTI-002' }
    ]
  }
});
console.log('Conflict:',
  conflict.decision === 'QUARANTINE' ? 'PASS' : 'FAIL');