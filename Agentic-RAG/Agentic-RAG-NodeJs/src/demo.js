import "dotenv/config";
import { tools } from "./toolsSetup.js";
import { runAgent, runConversationalAgent } from "./agent.js";

async function main() {
  console.log("=".repeat(80));
  console.log("AGENTIC RAG: Node.js Agent with Tools");
  console.log("=".repeat(80));

  // Warm up embeddings/vector index
  // Tools initialize on first call; run a tiny call to ensure readiness
  await tools[0].func({ input: "warmup" }).catch(() => {});

  // PART 5 analog: Simple RAG tool selection
  console.log("\n" + "=".repeat(80));
  console.log("PART 5: Simple Query - Agent Selects RAG Tool");
  console.log("=".repeat(80));
  const query1 = "How do I fix authentication problems after password reset?";
  console.log(`\nQuery: '${query1}'`);
  const resp1 = await runAgent(query1);
  console.log("\n" + "-".repeat(80));
  console.log("FINAL ANSWER:\n" + resp1);

  // PART 6: Specific Lookup
  console.log("\n" + "=".repeat(80));
  console.log("PART 6: Specific Lookup - Different Tool");
  console.log("=".repeat(80));
  const query2 = "Show me details of ticket TICK-005";
  console.log(`\nQuery: '${query2}'`);
  const resp2 = await runAgent(query2);
  console.log("\n" + "-".repeat(80));
  console.log("FINAL ANSWER:\n" + resp2);

  // PART 7: Category Filtering
  console.log("\n" + "=".repeat(80));
  console.log("PART 7: Category-Based Search");
  console.log("=".repeat(80));
  const query3 = "What payment-related issues have we seen?";
  console.log(`\nQuery: '${query3}'`);
  const resp3 = await runAgent(query3);
  console.log("\n" + "-".repeat(80));
  console.log("FINAL ANSWER:\n" + resp3);

  // PART 8: Statistics Query
  console.log("\n" + "=".repeat(80));
  console.log("PART 8: Statistics Query");
  console.log("=".repeat(80));
  const query4 = "Give me an overview of the ticket database";
  console.log(`\nQuery: '${query4}'`);
  const resp4 = await runAgent(query4);
  console.log("\n" + "-".repeat(80));
  console.log("FINAL ANSWER:\n" + resp4);

  // PART 10: Conversational Agent with Memory
  console.log("\n" + "=".repeat(80));
  console.log("PART 10: Conversational Agent with Memory");
  console.log("=".repeat(80));
  let conversation = [];
  console.log("\n--- Conversation Turn 1 ---");
  const convQ1 = "What issues have we had with iOS?";
  let res = await runConversationalAgent(conversation, convQ1);
  conversation = res[0];
  console.log("Assistant:\n" + res[1]);

  console.log("\n--- Conversation Turn 2 (Follow-up) ---");
  const convQ2 = "What was the ticket ID for that?";
  res = await runConversationalAgent(conversation, convQ2);
  conversation = res[0];
  console.log("Assistant:\n" + res[1]);

  console.log("\n--- Conversation Turn 3 (Another Follow-up) ---");
  const convQ3 = "How was it resolved?";
  res = await runConversationalAgent(conversation, convQ3);
  conversation = res[0];
  console.log("Assistant:\n" + res[1]);

  console.log("\n✓ Agent ready (Node.js demo complete)\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
