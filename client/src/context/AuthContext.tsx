/**
 * AuthContext.tsx — Global authentication state.
 *
 * Responsibilities:
 *  - Store the current user and JWT token in React state
 *  - Persist the token to localStorage so sessions survive page refreshes
 *  - Expose login(), register(), and logout() actions to the component tree
 *  - Attempt to restore a session on mount by calling GET /auth/me with the
 *    stored token; if the token is expired or invalid the server returns 401,
 *    the Axios interceptor clears the token, and we land on the login page
 *
 * The context value is never undefined inside the app because <AuthProvider>
 * wraps the entire component tree. The useAuth() hook throws if used outside
 * the provider as a programming-error guard.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { TOKEN_KEY } from '../api/axiosInstance';
import * as authApi from '../api/auth.api';
import type { User, LoginPayload, RegisterPayload } from '../types/auth.types';

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;        // true while restoring session on mount
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  // Start in loading state when there is a stored token so we validate it
  // before rendering protected routes.
  const [isLoading, setIsLoading] = useState<boolean>(
    () => Boolean(localStorage.getItem(TOKEN_KEY))
  );

  // ── Persist token ──────────────────────────────────────────────────────────
  const persistToken = useCallback((t: string | null) => {
    setToken(t);
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((me) => setUser(me))
      .catch(() => {
        // Token invalid or expired — clean up silently
        persistToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────

  const login = useCallback(async (payload: LoginPayload): Promise<void> => {
    const result = await authApi.login(payload);
    persistToken(result.token);
    setUser(result.user);
  }, [persistToken]);

  const register = useCallback(async (payload: RegisterPayload): Promise<void> => {
    const result = await authApi.register(payload);
    persistToken(result.token);
    setUser(result.user);
  }, [persistToken]);

  const logout = useCallback((): void => {
    persistToken(null);
    setUser(null);
  }, [persistToken]);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
