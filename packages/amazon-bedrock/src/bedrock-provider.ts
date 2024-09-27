import {
  LanguageModelV1,
  NoSuchModelError,
  ProviderV1,
} from '@ai-sdk/provider';
import { generateId, loadSetting } from '@ai-sdk/provider-utils';
import {
  BedrockRuntimeClient,
  BedrockRuntimeClientConfig,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockChatLanguageModel } from './bedrock-chat-language-model';
import {
  BedrockChatModelId,
  BedrockChatSettings,
} from './bedrock-chat-settings';

export interface AmazonBedrockProviderSettings {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;

  /**
   * Complete Bedrock configuration for setting advanced authentication and
   * other options. When this is provided, the region, accessKeyId, and
   * secretAccessKey settings are ignored.
   */
  bedrockOptions?: BedrockRuntimeClientConfig;

  // for testing
  generateId?: () => string;
}

export interface AmazonBedrockProvider extends ProviderV1 {
  (
    modelId: BedrockChatModelId,
    settings?: BedrockChatSettings,
  ): LanguageModelV1;

  languageModel(
    modelId: BedrockChatModelId,
    settings?: BedrockChatSettings,
  ): LanguageModelV1;
}

/**
Create an Amazon Bedrock provider instance.
 */
export function createAmazonBedrock(
  options: AmazonBedrockProviderSettings = {},
): AmazonBedrockProvider {
  const createBedrockRuntimeClient = () =>
    new BedrockRuntimeClient(
      options.bedrockOptions ?? {
        region: loadSetting({
          settingValue: options.region,
          settingName: 'region',
          environmentVariableName: 'AWS_REGION',
          description: 'AWS region',
        }),
        credentials: {
          accessKeyId: loadSetting({
            settingValue: options.accessKeyId,
            settingName: 'accessKeyId',
            environmentVariableName: 'AWS_ACCESS_KEY_ID',
            description: 'AWS access key ID',
          }),
          secretAccessKey: loadSetting({
            settingValue: options.secretAccessKey,
            settingName: 'secretAccessKey',
            environmentVariableName: 'AWS_SECRET_ACCESS_KEY',
            description: 'AWS secret access key',
          }),
          // Note we don't use `AWS_SESSION_TOKEN` as a default fallback here
          // because in some cases e.g. AWS serverless functions it can be
          // pre-populated with conflicting credentials.
          sessionToken: options.sessionToken,
        },
      },
    );

  const createChatModel = (
    modelId: BedrockChatModelId,
    settings: BedrockChatSettings = {},
  ) =>
    new BedrockChatLanguageModel(modelId, settings, {
      client: createBedrockRuntimeClient(),
      generateId,
    });

  const provider = function (
    modelId: BedrockChatModelId,
    settings?: BedrockChatSettings,
  ) {
    if (new.target) {
      throw new Error(
        'The Amazon Bedrock model function cannot be called with the new keyword.',
      );
    }

    return createChatModel(modelId, settings);
  };

  provider.languageModel = createChatModel;
  provider.textEmbeddingModel = (modelId: string) => {
    throw new NoSuchModelError({ modelId, modelType: 'textEmbeddingModel' });
  };

  return provider as AmazonBedrockProvider;
}

/**
Default Bedrock provider instance.
 */
export const bedrock = createAmazonBedrock();
