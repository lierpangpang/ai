import {
  OpenAIChatLanguageModel,
  OpenAIChatSettings,
} from '@ai-sdk/openai/internal';
import { OpenAICompletionSettings } from '@ai-sdk/openai/openai-completion-settings.ts';
import { loadApiKey, loadSetting } from '@ai-sdk/provider-utils';
import { AzureOpenAICompletionLanguageModel } from './azure-openai-completion-language-model';

export interface AzureOpenAIProvider {
  (
    deploymentId: string,
    settings?: OpenAIChatSettings,
  ): OpenAIChatLanguageModel;

  /**
Creates an Azure OpenAI chat model for text generation.
   */
  languageModel(
    deploymentId: string,
    settings?: OpenAIChatSettings,
  ): OpenAIChatLanguageModel;

  /**
Creates an Azure OpenAI chat model for text generation.
   */
  chat(
    deploymentId: string,
    settings?: OpenAIChatSettings,
  ): OpenAIChatLanguageModel;

  /**
   * Creates an Azure OpenAI completion model for text generation.
   */
  completion(
    modelId: string,
    settings?: OpenAICompletionSettings,
  ): AzureOpenAICompletionLanguageModel;
}

export interface AzureOpenAIProviderSettings {
  /**
Name of the Azure OpenAI resource.
     */
  resourceName?: string;

  /**
API key for authenticating requests.
     */
  apiKey?: string;

  /**
Custom fetch implementation. You can use it as a middleware to intercept requests,
or to provide a custom fetch implementation for e.g. testing.
    */
  fetch?: typeof fetch;
}

/**
Create an Azure OpenAI provider instance.
 */
export function createAzure(
  options: AzureOpenAIProviderSettings = {},
): AzureOpenAIProvider {
  const getHeaders = () => ({
    'api-key': loadApiKey({
      apiKey: options.apiKey,
      environmentVariableName: 'AZURE_API_KEY',
      description: 'Azure OpenAI',
    }),
  });

  const getResourceName = () =>
    loadSetting({
      settingValue: options.resourceName,
      settingName: 'resourceName',
      environmentVariableName: 'AZURE_RESOURCE_NAME',
      description: 'Azure OpenAI resource name',
    });

  const createChatModel = (
    deploymentName: string,
    settings: OpenAIChatSettings = {},
  ) =>
    new OpenAIChatLanguageModel(deploymentName, settings, {
      provider: 'azure-openai.chat',
      headers: getHeaders,
      url: ({ path, modelId }) =>
        `https://${getResourceName()}.openai.azure.com/openai/deployments/${modelId}${path}?api-version=2024-05-01-preview`,
      compatibility: 'compatible',
      fetch: options.fetch,
    });

  const createCompletionModel = (
    modelId: string,
    settings: OpenAICompletionSettings = {},
  ) =>
    new AzureOpenAICompletionLanguageModel(modelId, settings, {
      provider: 'azure-openai.completion',
      headers: getHeaders,
      baseURL: `https://${getResourceName()}.openai.azure.com/openai/deployments/${modelId}`,
      compatibility: 'compatible',
      fetch: options.fetch,
    });

  const provider = function (
    deploymentId: string,
    settings?: OpenAIChatSettings,
  ) {
    if (new.target) {
      throw new Error(
        'The Azure OpenAI model function cannot be called with the new keyword.',
      );
    }

    if (
      modelId === 'gpt-35-turbo-instruct' ||
      modelId === 'gpt-3.5-turbo-instruct'
    ) {
      return createCompletionModel(
        modelId,
        settings as OpenAICompletionSettings,
      );
    }

    return createChatModel(deploymentId, settings as OpenAIChatSettings);
  };

  provider.languageModel = createChatModel;
  provider.chat = createChatModel;
  provider.completion = createCompletionModel;

  return provider as AzureOpenAIProvider;
}

/**
Default Azure OpenAI provider instance.
 */
export const azure = createAzure({});
