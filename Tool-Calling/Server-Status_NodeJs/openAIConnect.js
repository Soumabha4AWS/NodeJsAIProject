import { OpenAI } from 'openai';

/**
 * Connects to OpenAI's official API.
 * @returns {OpenAI} OpenAI client instance
 */
export function queryOpenAI() {
  console.log(`\n--- Querying OpenAI (GPT-4.0 Mini) ---`);

  try {
    const client = new OpenAI({
      apiKey: '',
    });
    return client;
  } catch (error) {
    throw new Error(`OpenAI Error: ${error.message}`);
  }
}
