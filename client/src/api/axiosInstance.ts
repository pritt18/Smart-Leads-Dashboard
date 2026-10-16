/// <reference types="vite/client" />
/**
 * axiosInstance.ts — Configured Axios instance with JWT interceptors.
 *
 * Request interceptor: reads the token from localStorage and attaches it
 * as an Authorization header on every outgoing request. This means API
 * functions never need to manually pass the token.
 *
 * Response interceptor: on a 401, clears the stored token and redirects
 * to /login. This handles token expiry automatically regardless of which
 * page the user is on when it occurs.
 *
 * Using window.location.href for the redirect (rather than React Router's
 * navigate) because this module lives outside the React component tree.
 */
import axios from 'axios';

const TOKEN_KEY = 'leadflow_token';

const rawBaseURL: string =
  (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ??
  (import.meta.env['VITE_API_URL'] as string | undefined) ??
  '';

// Normalize: strip trailing slash and optional /api suffix so calls to /api/v1 always work
const normalizedBaseURL = rawBaseURL.replace(/\/+$/, '').replace(/\/api$/, '');

const axiosInstance = axios.create({
  baseURL: normalizedBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Only redirect if not already on an auth page to avoid redirect loops
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { TOKEN_KEY };
export default axiosInstance;
