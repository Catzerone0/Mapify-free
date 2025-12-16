import { NextResponse } from "next/server";
import { ApiError, isApiError } from "./errors";

// Re-export ApiError for convenience
export { ApiError };

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export function successResponse<T>(
  data: T,
  message?: string
): ApiResponseSuccess<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function errorResponse(
  error: ApiError | Error | string
): ApiResponseError {
  if (isApiError(error)) {
    return {
      success: false,
      error: {
        code: error.code || "UNKNOWN_ERROR",
        message: error.message,
        statusCode: error.statusCode,
      },
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error.message,
        statusCode: 500,
      },
    };
  }

  return {
    success: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: String(error),
      statusCode: 500,
    },
  };
}

export function apiSuccess<T>(
  data: T,
  statusCode: number = 200,
  message?: string
) {
  return NextResponse.json(successResponse(data, message), {
    status: statusCode,
  });
}

export function apiFail(error: ApiError | Error | string, statusCode?: number) {
  const response = errorResponse(error);
  const code = statusCode || response.error.statusCode;
  return NextResponse.json(response, { status: code });
}

// Unified API response function
export function apiResponse<T>(
  data: T | null,
  message?: string,
  statusCode: number = 200
) {
  if (data === null && message) {
    // Error case
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ERROR',
          message,
          statusCode,
        },
      },
      { status: statusCode }
    );
  }
  
  // Success case
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: statusCode }
  );
}
