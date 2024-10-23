export type LanguageModelResponseMetadata = {
  /**
  ID for the generated response.
     */
  id: string;

  /**
  Timestamp for the start of the generated response.
  */
  timestamp: Date;

  /**
  The ID of the response model that was used to generate the response.
  */
  modelId: string;

  /**
Response headers.
     */
  headers?: Record<string, string>;
};

/**
@deprecated Use `LanguageModelResponseMetadata` instead.
 */
export type LanguageModelResponseMetadataWithHeaders =
  LanguageModelResponseMetadata;
