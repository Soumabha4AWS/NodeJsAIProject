import * as openAIConnect from './openAIConnect.js';
import * as serverStatusToolsSchema from './serverStatusToolsSchema.js';
import * as serverStatusFunc from './serverStatusFunc.js';

export async function runAgent(userIssue) {
  console.log(`\n--- New Incident: ${userIssue} ---`);

  const messages = [
    {
      role: 'system',
      content:
        'You are a Level 1 IT Responder. Investigate server issues. ' +
        'If CPU or Memory is > 90%, restart the service. If logs show critical dependency errors (like connection refused) that a restart won\'t fix, escalate to an engineer.',
    },
    {
      role: 'user',
      content: userIssue,
    },
  ];

  const client = openAIConnect.queryOpenAI();

  while (true) {
    console.log('\n[AI Thinking...]');

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        tools: serverStatusToolsSchema.toolsSchema,
        tool_choice: 'auto',
      });

      const responseMsg = response.choices[0].message;
      messages.push(responseMsg);

      if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
        for (const toolCall of responseMsg.tool_calls) {
          const funcName = toolCall.function.name;
          const funcArgs = JSON.parse(toolCall.function.arguments);

          // Retrieve the actual function based on name
          const functionToCall = serverStatusFunc.AVAILABLE_FUNCTIONS[funcName];

          if (functionToCall) {
            // Execute the function
            const toolOutput = functionToCall(...Object.values(funcArgs));

            // Append the result to messages
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: funcName,
              content: toolOutput,
            });
          }
        }
      } else {
        console.log(`\n[FINAL RESPONSE]: ${responseMsg.content}`);
        break;
      }
    } catch (error) {
      console.error(`Error in agent loop: ${error.message}`);
      break;
    }
  }
}
