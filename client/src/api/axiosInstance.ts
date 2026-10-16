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

const axiosInstance = axios.create({
  // In development the Vite proxy forwards /api → localhost:5000.
  // In production set VITE_API_BASE_URL to the deployed API origin.
  baseURL: import.meta.env['VITE_API_BASE_URL'] ?? '',
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
