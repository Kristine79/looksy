export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AIError";
  }
}

export class ProviderConfigurationError extends AIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "PROVIDER_CONFIGURATION", false, details);
  }
}

export class ProviderTimeoutError extends AIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "PROVIDER_TIMEOUT", true, details);
  }
}

export class ProviderRateLimitError extends AIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "PROVIDER_RATE_LIMIT", true, details);
  }
}

export class InvalidAIResponseError extends AIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "INVALID_AI_RESPONSE", false, details);
  }
}

export function isRetryableAIError(error: unknown): boolean {
  return error instanceof AIError && error.retryable;
}
