/**
 * auth.api.ts — Typed API functions for authentication endpoints.
 *
 * Each function unwraps the server's { success, data } envelope and
 * returns just the data so callers work with clean types. Axios errors
 * propagate as-is so the caller (AuthContext / form handler) can inspect
 * error.response.data for validation messages.
 */
import axiosInstance from './axiosInstance';
import type { AuthResponse, LoginPayload, RegisterPayload } from '../types/auth.types';
import type { ApiSuccess } from '../types/api.types';
import type { User } from '../types/auth.types';

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await axiosInstance.post<ApiSuccess<AuthResponse>>(
    '/api/v1/auth/register',
    payload
  );
  return res.data.data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await axiosInstance.post<ApiSuccess<AuthResponse>>(
    '/api/v1/auth/login',
    payload
  );
  return res.data.data;
}

export async function getMe(): Promise<User> {
  const res = await axiosInstance.get<ApiSuccess<{ user: User }>>('/api/v1/auth/me');
  return res.data.data.user;
}
