/**
 * Symbol used for identifying AI SDK Error instances.
 */
const symbol = Symbol.for('vercel.ai.error');

/**
 * Custom error class for AI SDK related errors.
 * @extends Error
 */
export class AISDKError extends Error {
  private readonly [symbol] = true; // used in isInstance

  /**
   * The underlying cause of the error, if any.
   */
  readonly cause?: unknown;

  /**
   * Creates an AI SDK Error.
   *
   * @param {Object} params - The parameters for creating the error.
   * @param {string} params.name - The name of the error.
   * @param {string} params.message - The error message.
   * @param {unknown} [params.cause] - The underlying cause of the error.
   */
  constructor({
    name,
    message,
    cause,
  }: {
    name: string;
    message: string;
    cause?: unknown;
  }) {
    super(message);

    this.name = name;
    this.cause = cause;
  }

  /**
   * Checks if the given error is an AI SDK Error.
   * @param {unknown} error - The error to check.
   * @returns {boolean} True if the error is an AI SDK Error, false otherwise.
   */
  static isInstance(error: unknown): error is AISDKError {
    return (
      error != null &&
      (error instanceof AISDKError ||
        (typeof error === 'object' &&
          symbol in error &&
          typeof error[symbol] === 'boolean' &&
          error[symbol] === true))
    );
  }

  /**
   * Returns a JSON representation of the error.
   * @returns {Object} An object containing the error's name, message, and cause.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      cause: this.cause,
    };
  }
}
