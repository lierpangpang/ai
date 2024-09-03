import { NoSuchModelError } from '@ai-sdk/provider';
import { EmbeddingModel, LanguageModel, Provider } from '../types';
import { NoSuchProviderError } from './no-such-provider-error';
import { experimental_Provider } from './provider';

/**
Registry for managing models. It enables getting a model with a string id.

@deprecated Use `experimental_Provider` instead.
 */
export type experimental_ProviderRegistry = Provider;

/**
 * @deprecated Use `experimental_ProviderRegistry` instead.
 */
export type experimental_ModelRegistry = experimental_ProviderRegistry;

/**
 * Creates a registry for the given providers.
 */
export function experimental_createProviderRegistry(
  providers: Record<string, experimental_Provider | Provider>,
): Provider {
  const registry = new DefaultProviderRegistry();

  for (const [id, provider] of Object.entries(providers)) {
    registry.registerProvider({ id, provider });
  }

  return registry;
}

/**
 * @deprecated Use `experimental_createProviderRegistry` instead.
 */
export const experimental_createModelRegistry =
  experimental_createProviderRegistry;

class DefaultProviderRegistry implements Provider {
  private providers: Record<string, experimental_Provider | Provider> = {};

  registerProvider({
    id,
    provider,
  }: {
    id: string;
    provider: experimental_Provider | Provider;
  }): void {
    this.providers[id] = provider;
  }

  private getProvider(id: string): experimental_Provider | Provider {
    const provider = this.providers[id];

    if (provider == null) {
      throw new NoSuchProviderError({
        modelId: id,
        modelType: 'languageModel',
        providerId: id,
        availableProviders: Object.keys(this.providers),
      });
    }

    return provider;
  }

  private splitId(
    id: string,
    modelType: 'languageModel' | 'textEmbeddingModel',
  ): [string, string] {
    const index = id.indexOf(':');

    if (index === -1) {
      throw new NoSuchModelError({
        modelId: id,
        modelType,
        message:
          `Invalid ${modelType} id for registry: ${id} ` +
          `(must be in the format "providerId:modelId")`,
      });
    }

    return [id.slice(0, index), id.slice(index + 1)];
  }

  languageModel(id: string): LanguageModel {
    const [providerId, modelId] = this.splitId(id, 'languageModel');
    const model = this.getProvider(providerId).languageModel?.(modelId);

    if (model == null) {
      throw new NoSuchModelError({ modelId: id, modelType: 'languageModel' });
    }

    return model;
  }

  textEmbeddingModel(id: string): EmbeddingModel<string> {
    const [providerId, modelId] = this.splitId(id, 'textEmbeddingModel');
    const provider = this.getProvider(providerId);

    const model =
      provider.textEmbeddingModel?.(modelId) ??
      ('textEmbedding' in provider
        ? provider.textEmbedding?.(modelId)
        : undefined);

    if (model == null) {
      throw new NoSuchModelError({
        modelId: id,
        modelType: 'textEmbeddingModel',
      });
    }

    return model;
  }

  /**
   * @deprecated Use `textEmbeddingModel` instead.
   */
  textEmbedding(id: string): EmbeddingModel<string> {
    return this.textEmbeddingModel(id);
  }
}
