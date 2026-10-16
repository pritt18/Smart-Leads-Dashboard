/**
 * api.types.ts — Server response envelope types.
 * These mirror the ApiSuccess / ApiError shapes defined on the backend.
 */

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: ApiFieldError[];
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
