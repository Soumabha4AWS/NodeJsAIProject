import { HumanMessage, AIMessage, ToolMessage, SystemMessage } from "@langchain/core/messages";
import { llmWithTools, tools, toolDefinitions, IS_OFFLINE } from "./toolsSetup.js";

function chooseToolForQuery(query) {
  const q = String(query || "").toLowerCase();
  const idMatch = q.match(/tick-\d{3,}/i);
  if (idMatch) {
    return { name: "GetTicketByID", input: idMatch[0].toUpperCase() };
  }
  if (q.includes("overview") || q.includes("statistic") || q.includes("summary")) {
    return { name: "GetTicketStatistics", input: "" };
  }
  if (q.includes("authentication") || q.includes("auth")) {
    return { name: "SearchByCategory", input: "Authentication" };
  }
  if (q.includes("database") || q.includes("sql")) {
    return { name: "SearchByCategory", input: "Database" };
  }
  if (q.includes("payment") || q.includes("billing") || q.includes("stripe")) {
    return { name: "SearchByCategory", input: "Payment" };
  }
  if (q.includes("mobile") || q.includes("ios") || q.includes("android")) {
    return { name: "SearchByCategory", input: "Mobile" };
  }
  return { name: "SearchSimilarTickets", input: query };
}

export async function runAgent(query, maxIterations = 5) {
  if (IS_OFFLINE) {
    const plan = chooseToolForQuery(query);
    const tool = tools.find((t) => t.name === plan.name);
    const output = await tool.func({ input: plan.input });
    return output;
  }
  const messages = [
    new SystemMessage({
      content:
        "You are an expert support desk assistant that helps troubleshoot technical issues.\nYou have access to a database of previous support tickets with their resolutions.\nUse your tools to find relevant information and provide helpful, accurate answers.\n\nGuidelines:\n- ALWAYS search for similar tickets when asked about troubleshooting or 'how to fix' questions\n- Be specific and reference ticket IDs when providing solutions\n- If multiple similar issues exist, mention the most relevant ones\n- Admit when you don't have enough information\n- Be concise but thorough in your responses\n- When appropriate, use multiple tools to gather complete information\n- Before each tool call, provide a short public rationale in content using this exact prefix:\n    'Decision: <one sentence explaining why this tool is needed>'\n\nRemember: Your primary value is retrieving and applying solutions from past tickets!",
    }),
    new HumanMessage({ content: query }),
  ];

  for (let i = 0; i < maxIterations; i++) {
    const response = await llmWithTools.invoke(messages, { tools: toolDefinitions, tool_choice: "auto" });
    messages.push(response);

    // No tool calls → final answer
    const toolCalls = response?.tool_calls ?? [];
    if (!toolCalls || toolCalls.length === 0) {
      return response.content;
    }

    const decisionTrace = String(response.content || "").trim();
    if (decisionTrace) {
      // Optional: log decision trace to console for visibility
      // console.log(`\n🧭 ${decisionTrace}`);
    }

    for (const tc of toolCalls) {
      const name = tc.name;
      const args = tc.args || {};
      let toolOutput = null;
      for (const t of tools) {
        if (t.name === name) {
          // Tools expect an object like { input }
          toolOutput = await t.func({ input: args.input });
          break;
        }
      }
      if (toolOutput == null) {
        toolOutput = `Error: Tool ${name} not found`;
      }
      messages.push(new ToolMessage({ content: String(toolOutput), tool_call_id: tc.id }));
    }
  }
  return "Maximum iterations reached. Could not complete the task.";
}

export async function runConversationalAgent(conversationHistory, query, maxIterations = 5) {
  if (IS_OFFLINE) {
    const plan = chooseToolForQuery(query);
    const tool = tools.find((t) => t.name === plan.name);
    const output = await tool.func({ input: plan.input });
    return [
      [
        new SystemMessage({ content: "Offline mode: simple tool routing used." }),
        ...conversationHistory,
        new HumanMessage({ content: query }),
        new AIMessage({ content: `Decision: Using ${plan.name} in offline mode.` }),
        new ToolMessage({ content: output, tool_call_id: "offline-1" }),
      ],
      output,
    ];
  }
  const messages = [
    new SystemMessage({
      content:
        "You are an expert support desk assistant that helps troubleshoot technical issues.\nUse your tools to find relevant information and maintain context across our conversation.\nBefore each tool call, provide a short public rationale in content using this exact prefix:\n'Decision: <one sentence explaining why this tool is needed>'.",
    }),
    ...conversationHistory,
    new HumanMessage({ content: query }),
  ];

  for (let i = 0; i < maxIterations; i++) {
    const response = await llmWithTools.invoke(messages, { tools: toolDefinitions, tool_choice: "auto" });
    messages.push(response);
    const toolCalls = response?.tool_calls ?? [];
    if (!toolCalls || toolCalls.length === 0) {
      return [messages, response.content];
    }
    for (const tc of toolCalls) {
      const name = tc.name;
      const args = tc.args || {};
      let toolOutput = null;
      for (const t of tools) {
        if (t.name === name) {
          toolOutput = await t.func({ input: args.input });
          break;
        }
      }
      if (toolOutput == null) toolOutput = `Error: Tool ${name} not found`;
      messages.push(new ToolMessage({ content: String(toolOutput), tool_call_id: tc.id }));
    }
  }
  return [messages, "Maximum iterations reached."];
}
