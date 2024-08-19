import { InvalidPromptError } from '@ai-sdk/provider';
import { getValidatedPrompt } from './get-validated-prompt';

describe('message prompt', () => {
  it('should throw InvalidPromptError when system message has parts', () => {
    expect(() => {
      getValidatedPrompt({
        messages: [
          {
            role: 'system',
            content: [{ type: 'text', text: 'test' }] as any,
          },
        ],
      });
    }).toThrow(InvalidPromptError);
  });
});
