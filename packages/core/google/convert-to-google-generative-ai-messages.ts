import { LanguageModelV1Prompt, UnsupportedFunctionalityError } from '../spec';
import { GoogleGenerativeAIPrompt } from './google-generative-ai-prompt';

export function convertToGoogleGenerativeAIMessages({
  prompt,
  provider,
}: {
  prompt: LanguageModelV1Prompt;
  provider: string;
}): GoogleGenerativeAIPrompt {
  const messages: GoogleGenerativeAIPrompt = [];

  for (const { role, content } of prompt) {
    switch (role) {
      case 'system': {
        throw new UnsupportedFunctionalityError({
          provider,
          functionality: 'system-message',
        });
        break;
      }

      case 'user': {
        messages.push({
          role: 'user',
          parts: content.map(part => {
            switch (part.type) {
              case 'text': {
                return { text: part.text };
              }
              case 'image': {
                throw new UnsupportedFunctionalityError({
                  provider,
                  functionality: 'image-part',
                });
              }
            }
          }),
        });
        break;
      }

      case 'assistant': {
        messages.push({
          role: 'model',
          parts: content.map(part => {
            switch (part.type) {
              case 'text': {
                return { text: part.text };
              }
              case 'tool-call': {
                throw new UnsupportedFunctionalityError({
                  provider,
                  functionality: 'tool-call',
                });
              }
            }
          }),
        });
        break;
      }

      case 'tool': {
        throw new UnsupportedFunctionalityError({
          provider,
          functionality: 'tool-message',
        });
        break;
      }
      default: {
        const _exhaustiveCheck: never = role;
        throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
      }
    }
  }

  return messages;
}
