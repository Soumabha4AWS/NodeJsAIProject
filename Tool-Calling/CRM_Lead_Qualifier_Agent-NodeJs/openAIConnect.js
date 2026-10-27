const { OpenAI } = require("openai");

function queryOpenAI() {
  console.log("\n--- Querying OpenAI (GPT-4.0 Mini) ---");

  const apiKey = "";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable not set.");
  }

  return new OpenAI({ apiKey });
}

module.exports = { queryOpenAI };