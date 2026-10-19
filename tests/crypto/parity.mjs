import { compileAgent } from '../../identity-compiler/src/compiler.js';
import { evaluatePodAgainstPolicy } from '../../local-policy-evaluator/src/evaluator.js';

const input = {
  agentId: 'EA-482991',
  agentClass: 'ENTERPRISE_AGENT',
  licenseTier: 'TIER_4',
  symbolicNamespace: '#us#.enterprise.partner.ai',
  k8sNamespace: 'us-enterprise-partner-ai',
  mission: 'Enterprise AI Control',
  owner: { orgId: 'urn:us:org:example', displayName: 'Example' },
  grammarLicense: {
    enabled: true,
    level: 'RESTRICTED',
    allowedPrefixes: ['#us#.enterprise.']
  },
  accessible_gates: ['GATE_01', 'GATE_02', 'GATE_03', 'GATE_04']
};

try {
  const { policy } = compileAgent(input);

  const pod = {
    metadata: {
      name: 'ea-482991',
      namespace: policy.spec.k8sNamespace,
      labels: { 'acelogic.ai/agent-id': policy.spec.agentId },
      annotations: {
        'acelogic.ai/symbolic-namespace': policy.spec.symbolicNamespace,
        'acelogic.ai/purpose-hash': policy.spec.purposeHash
      }
    }
  };

  const result = evaluatePodAgainstPolicy({ pod, policy });

  console.log('Fingerprint:', policy.spec.fingerprint);
  console.log('Purpose hash:', policy.spec.purposeHash);
  console.log('Result:', result.reason);
  console.log('Parity:', result.reason === 'ACELOGIC_APPROVED' ? 'PASS' : 'FAIL');
} catch (err) {
  console.log('ERROR:', err.message);
  console.log('Stack:', err.stack);
}