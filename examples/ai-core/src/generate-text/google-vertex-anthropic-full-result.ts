import 'dotenv/config';
import { vertexAnthropic } from '@ai-sdk/google-vertex/anthropic';
import { generateText } from 'ai';

async function main() {
  const result = await generateText({
    model: vertexAnthropic('claude-3-5-sonnet@20240620'),
    prompt: 'Invent a new holiday and describe its traditions.',
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
