import * as serverStatusModule from './serverStatusModule.js';

async function main() {
  console.log('\n' + '='.repeat(80) + '\n');
  // Scenario A: Should trigger a restart (CPU is 98%)
  await serverStatusModule.runAgent(
    'The payment-server-01 is extremely slow and timing out.'
  );

  console.log('\n' + '='.repeat(80) + '\n');
  // Scenario B: Should trigger an escalation (DB is healthy but logs might be weird)
  await serverStatusModule.runAgent('Something is wrong with db-node-02.');

  console.log('\n' + '='.repeat(80) + '\n');
  // Scenario C: The High Memory Case (auth-service-03)
  await serverStatusModule.runAgent(
    'Users are reporting login failures on auth-service-03.'
  );

  console.log('\n' + '='.repeat(80) + '\n');
  // Scenario D: The Dependency Failure (search-index-09)
  await serverStatusModule.runAgent(
    'Search isn\'t working. Can you check search-index-09?'
  );

  console.log('\n' + '='.repeat(80) + '\n');
}

main().catch(console.error);
