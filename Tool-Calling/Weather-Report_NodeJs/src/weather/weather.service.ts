import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service';
import { WeatherApiService } from './weather-api.service';
import OpenAI from 'openai';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_call_id?: string;
  name?: string;
}

@Injectable()
export class WeatherService {
  private readonly systemPrompt = 'You are an Weather Report Agent';

  private readonly toolsSchema = [
    {
      type: 'function',
      function: {
        name: 'get_current_weather',
        description: 'Get current weather in a given location.',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City Name like London, California',
            },
          },
          required: ['location'],
        },
      },
    },
  ];

  constructor(
    private openAiService: OpenAiService,
    private weatherApiService: WeatherApiService,
  ) {}

  async getWeatherReport(userPrompt: string): Promise<string> {
    console.log('\n--- Running Getting Weather Report Agent ---');

    const client = this.openAiService.getClient();
    const messages: Message[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    while (true) {
      console.log('\n[AI Thinking...]');

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        tools: this.toolsSchema as OpenAI.Chat.ChatCompletionTool[],
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0].message;

      // Preserve the assistant message including any tool_calls metadata
      // so that subsequent tool result messages are recognized as replies
      // to the assistant's tool call.
      messages.push(responseMessage as any);

      // If the model requested tool calls, execute them and append tool
      // result messages. Each tool message must follow an assistant
      // message that contained the corresponding tool_calls.
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCalls = responseMessage.tool_calls;

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          let functionResult: string;

          if (functionName === 'get_current_weather') {
            functionResult = await this.weatherApiService.getCurrentWeather(
              functionArgs.location,
            );
          } else {
            console.log(`Error: Unknown function ${functionName}`);
            functionResult = `Error: Unknown function ${functionName}`;
          }

          // Append a tool-role message that references the tool_call id
          // returned by the assistant message above.
          messages.push({
            role: 'tool',
            name: functionName,
            tool_call_id: toolCall.id,
            content: functionResult,
          } as any);
        }
      } else {
        console.log('\n--- FINAL AGENT SUMMARY ---');
        console.log(responseMessage);
        return responseMessage.content || 'No response from AI';
      }
    }
  }
}
