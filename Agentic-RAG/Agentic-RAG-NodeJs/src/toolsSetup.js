import { ChatOpenAI } from "@langchain/openai";
import { SupportTicketTools } from "./tools.js";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
export const IS_OFFLINE = !process.env.OPENAI_API_KEY;

export const llm = IS_OFFLINE
  ? null
  : new ChatOpenAI({
      model: OPENAI_MODEL,
      apiKey: process.env.OPENAI_API_KEY,
      temperature: 0,
    });

const toolManager = new SupportTicketTools();
export const tools = toolManager.getTools();

// Convert tools to OpenAI function format
export const toolDefinitions = tools.map((t) => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));

// In LangChain JS, models accept a tools param in invoke. We'll pass toolDefinitions there.
export const llmWithTools = llm; // pass { tools: toolDefinitions } on invoke when online
