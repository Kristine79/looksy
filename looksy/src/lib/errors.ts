import {
  InvalidAIResponseError,
  ProviderConfigurationError,
  ProviderRateLimitError,
  ProviderTimeoutError,
} from "@/modules/ai";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource} not found${id ? `: ${id}` : ""}`,
      "NOT_FOUND",
      404
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service temporarily unavailable") {
    super(message, "SERVICE_UNAVAILABLE", 503);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ProviderConfigurationError) {
    return Response.json(
      {
        error: {
          code: "AI_CONFIGURATION_ERROR",
          message: "AI provider is not configured. Set AI_API_KEY in the environment.",
        },
      },
      { status: 503 }
    );
  }
  if (error instanceof ProviderTimeoutError || error instanceof ProviderRateLimitError) {
    return Response.json(
      {
        error: {
          code: "AI_PROVIDER_UNAVAILABLE",
          message: "The AI provider is temporarily unavailable. Please try again.",
        },
      },
      { status: 503 }
    );
  }
  if (error instanceof InvalidAIResponseError) {
    return Response.json(
      {
        error: {
          code: "AI_RESPONSE_INVALID",
          message: "The AI provider returned an invalid response. Please retry.",
        },
      },
      { status: 502 }
    );
  }

  console.error("Unexpected error:", error);
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}
