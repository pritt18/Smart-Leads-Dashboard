/**
 * auth.types.ts — TypeScript interfaces for authentication data.
 * Mirror the shape returned by the server so responses are typed end-to-end.
 */

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
