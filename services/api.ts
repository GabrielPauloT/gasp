import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { getAuthToken, removeAuthToken } from '@/utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// ── Request interceptor: inject JWT ────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 + refresh ─────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // If 401 and not already retried, try to refresh
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const currentToken = await getAuthToken();
        if (!currentToken) throw new Error('No token');

        const { data } = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${currentToken}` } },
        );

        const newToken = data.token as string;
        useAuthStore.getState().setToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // Refresh failed → logout
        await removeAuthToken();
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// ── Typed response helpers ─────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown[];
}

/** Extract error message from API response */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    return data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
