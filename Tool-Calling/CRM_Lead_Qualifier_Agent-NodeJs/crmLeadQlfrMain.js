const module1 = require("./crmLeadQlfrModule1");
const module2 = require("./crmLeadQlfrModule2");

async function main() {
  const leadEmail1 = "jane@acmecorp.com";
  console.log("\n" + "=".repeat(80) + "\n");
  await module1.run_agent(`Please qualify this lead for my call tomorrow: ${leadEmail1}`);
  console.log("\n" + "+".repeat(80) + "\n");
  await module2.run_agent(`Please qualify this lead for my call tomorrow: ${leadEmail1}`);
  console.log("\n" + "=".repeat(80) + "\n");

  const leadEmail2 = "bob@widgetco.net";
  await module1.run_agent(`Can you run an analysis on this lead: ${leadEmail2}`);
  console.log("\n" + "+".repeat(80) + "\n");
  await module2.run_agent(`Can you run an analysis on this lead: ${leadEmail2}`);
  console.log("\n" + "=".repeat(80) + "\n");
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});