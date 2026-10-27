const openAIConnect = require("./openAIConnect");
const crmLeadQlfrToolsSchema = require("./crmLeadQlfrToolsSchema");
const crmLeadQlfrFunc = require("./crmLeadQlfrFunc");

async function run_agent(userPrompt) {
  console.log("\n--- Running Lead Qualifier Agent ---");

  const systemPrompt =
    "You are an expert CRM Lead Qualifier Agent. Your sole task is to analyze a sales lead " +
    "provided via email address. You must follow these steps precisely: " +
    "1. Identify the domain from the email. " +
    "2. Call `lookup_domain_info` and `check_crm_history` sequentially to gather all data. " +
    "3. Combine all collected data into a single JSON object. " +
    "4. Call `calculate_lead_score` with the combined JSON object. " +
    "5. Finally, synthesize all information (domain info, CRM history, and score) " +
    "into a single, easy-to-read summary for a busy sales rep.";

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const collectedData = {};
  const client = openAIConnect.queryOpenAI();

  while (true) {
    console.log("\n[AI Thinking...]");
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools: crmLeadQlfrToolsSchema.toolsSchema,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;
    messages.push(responseMessage);

    const toolCalls = responseMessage.tool_calls || [];

    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments || "{}");
        const functionToCall = crmLeadQlfrFunc.AVAILABLE_FUNCTIONS[functionName];

        if (!functionToCall) {
          console.error(`Error: Unknown function ${functionName}`);
          continue;
        }

        let functionResult;
        if (functionName === "lookup_domain_info") {
          functionResult = functionToCall(functionArgs.domain);
          collectedData.domain_info = JSON.parse(functionResult);
        } else if (functionName === "check_crm_history") {
          functionResult = functionToCall(functionArgs.email);
          collectedData.crm_history = JSON.parse(functionResult);
        } else if (functionName === "calculate_lead_score") {
          functionResult = functionToCall(JSON.stringify(collectedData));
        } else {
          functionResult = functionToCall(...Object.values(functionArgs));
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: functionResult,
        });
      }
    } else {
      console.log("\n--- FINAL AGENT SUMMARY ---");
      console.log(responseMessage.content);
      break;
    }
  }
}

module.exports = { run_agent };