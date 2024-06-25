import {
  DeepPartial,
  isDeepEqualData,
  parsePartialJson,
} from '@ai-sdk/ui-utils';
import { useCallback, useId, useRef, useState } from 'react';
import useSWR from 'swr';
import z from 'zod';

export type Experimental_UseObjectOptions<RESULT> = {
  /**
   * The API endpoint. It should stream JSON that matches the schema as chunked text.
   */
  api: string;

  /**
   * A Zod schema that defines the shape of the complete object.
   */
  schema: z.Schema<RESULT>;

  /**
   * An unique identifier. If not provided, a random one will be
   * generated. When provided, the `useObject` hook with the same `id` will
   * have shared states across components.
   */
  id?: string;

  /**
   * An optional value for the initial object.
   */
  initialValue?: DeepPartial<RESULT>;
};

export type Experimental_UseObjectHelpers<RESULT, INPUT> = {
  /**
   * Calls the API with the provided input as JSON body.
   */
  setInput: (input: INPUT) => void;

  /**
   * The current value for the generated object. Updated as the API streams JSON chunks.
   */
  object: DeepPartial<RESULT> | undefined;

  /**
   * The error object of the API request if any.
   */
  error: undefined | unknown;

  /**
   * Flag that indicates whether an API request is in progress.
   */
  isLoading: boolean;

  /**
   * Abort the current request immediately, keep the current partial object if any.
   */
  stop: () => void;
};

function useObject<RESULT, INPUT = any>({
  api,
  id,
  schema, // required, in the future we will use it for validation
  initialValue,
}: Experimental_UseObjectOptions<RESULT>): Experimental_UseObjectHelpers<
  RESULT,
  INPUT
> {
  // Generate an unique id if not provided.
  const hookId = useId();
  const completionId = id ?? hookId;

  // Store the completion state in SWR, using the completionId as the key to share states.
  const { data, mutate } = useSWR<DeepPartial<RESULT>>(
    [api, completionId],
    null,
    { fallbackData: initialValue },
  );

  const [error, setError] = useState<undefined | unknown>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Abort controller to cancel the current API call.
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  return {
    async setInput(input) {
      try {
        setIsLoading(true);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const response = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortController.signal,
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          throw new Error(
            (await response.text()) ?? 'Failed to fetch the response.',
          );
        }

        if (response.body == null) {
          throw new Error('The response body is empty.');
        }

        let accumulatedText = '';
        let latestObject: DeepPartial<RESULT> | undefined = undefined;

        response.body.pipeThrough(new TextDecoderStream()).pipeTo(
          new WritableStream<string>({
            write(chunk) {
              accumulatedText += chunk;

              const currentObject = parsePartialJson(
                accumulatedText,
              ) as DeepPartial<RESULT>;

              if (!isDeepEqualData(latestObject, currentObject)) {
                latestObject = currentObject;

                mutate(currentObject);
              }
            },
          }),
        );

        setError(undefined);
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    object: data,
    error,
    isLoading,
    stop,
  };
}

export const experimental_useObject = useObject;
