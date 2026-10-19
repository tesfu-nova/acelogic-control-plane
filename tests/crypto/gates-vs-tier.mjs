import { compileAgent } from '../../identity-compiler/src/compiler.js';
import { evaluatePodAgainstPolicy } from '../../local-policy-evaluator/src/evaluator.js';

function buildPod(policy) {
  return {
    metadata: {
      name: 'test',
      namespace: policy.spec.k8sNamespace,
      labels: { 'acelogic.ai/agent-id': policy.spec.agentId },
      annotations: {
        'acelogic.ai/symbolic-namespace': policy.spec.symbolicNamespace,
        'acelogic.ai/purpose-hash': policy.spec.purposeHash
      }
    }
  };
}

// Case 1: TIER_5 + no Gate 9 → covenant NOT required
const input1 = {
  agentId: 'TEST-TIER5-NO-GATE9',
  agentClass: 'ENTERPRISE_AGENT',
  licenseTier: 'TIER_5',
  symbolicNamespace: '#us#.test.case1',
  k8sNamespace: 'us-test-case1',
  mission: 'Test mission 1',
  owner: 'Test Owner',
  compliance: null,
  jurisdiction: null,
  grammarLicense: {
    enabled: true,
    level: 'RESTRICTED',
    allowedPrefixes: ['#us#.test.']
  },
  accessible_gates: ['GATE_01', 'GATE_02']
};

const { policy: policy1 } = compileAgent(input1);
const result1 = evaluatePodAgainstPolicy({
  pod: buildPod(policy1),
  policy: policy1
});
console.log('TIER_5 + no Gate 9 → covenant NOT required:',
  result1.reason === 'ACELOGIC_APPROVED' ? 'PASS' : 'FAIL');
console.log('  Reason:', result1.reason);

// Case 2: TIER_4 + Gate 9 → covenant required and valid
const input2 = {
  agentId: 'TEST-TIER4-WITH-GATE9',
  agentClass: 'ENTERPRISE_AGENT',
  licenseTier: 'TIER_4',
  symbolicNamespace: '#us#.test.case2',
  k8sNamespace: 'us-test-case2',
  mission: 'Test mission 2',
  owner: 'Test Owner',
  compliance: null,
  jurisdiction: null,
  grammarLicense: {
    enabled: true,
    level: 'RESTRICTED',
    allowedPrefixes: ['#us#.test.']
  },
  accessible_gates: ['GATE_09']
};

const { policy: policy2 } = compileAgent(input2);
const result2 = evaluatePodAgainstPolicy({
  pod: buildPod(policy2),
  policy: policy2
});
console.log('TIER_4 + Gate 9 → covenant required and valid:',
  result2.reason === 'ACELOGIC_APPROVED' ? 'PASS' : 'FAIL');
console.log('  Reason:', result2.reason);