const OpenAI = require("openai");

async function queryOpenAI(prompt) {
  console.log("\n--- Querying OpenAI (GPT-4o-mini) ---");

  const client = new OpenAI({
    apiKey: "",
  });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    return `OpenAI Error: ${error}`;
  }
}

module.exports = { queryOpenAI };