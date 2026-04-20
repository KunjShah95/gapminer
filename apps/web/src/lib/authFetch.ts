/**
 * Get the auth token from the Zustand store's persisted state.
 * This replaces direct localStorage access which was inconsistent across pages.
 */
export function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem("gapminer-auth");
    if (!raw) return null;
    const state = JSON.parse(raw);
    return state?.state?.token || null;
  } catch {
    return null;
  }
}

/**
 * Fetch wrapper that automatically includes the auth token.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Safely parse JSON from a response.
 * Returns fallback when body is empty or invalid JSON.
 */
export async function safeReadJson<T = any>(
  response: Response,
  fallback: T,
): Promise<T> {
  const raw = await response.text();
  if (!raw || !raw.trim()) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
