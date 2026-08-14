/**
 * Browser-side HTTP helper for the HMS API.
 *
 * Every write in HMSContext used to be `fetch(...).catch(console.error)` —
 * fire-and-forget. A rejected write (validation error, 403 from the new RBAC
 * layer, database outage) left the screen showing a record that was never
 * saved, and nothing told the user. These helpers surface failures instead.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly reason?: string;

  constructor(status: number, message: string, reason?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.reason = reason;
  }

  /** True when the session has expired or was never established. */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  /** True when the signed-in role is not permitted to perform the action. */
  get isForbidden(): boolean {
    return this.status === 403;
  }
}

async function parse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) };
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);

  try {
    response = await fetch(url, {
      method,
      credentials: 'same-origin',
      signal: controller.signal,
      ...(body !== undefined && {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    });
  } catch (cause) {
    throw new ApiError(0, `Cannot reach the HealthEasy-G server (${method} ${url}).`);
  } finally {
    window.clearTimeout(timeout);
  }

  const payload = await parse(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error || `${method} ${url} failed with status ${response.status}.`,
      payload?.reason
    );
  }

  return payload as T;
}

export interface ListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body: unknown) => request<T>('POST', url, body),
  patch: <T>(url: string, body: unknown) => request<T>('PATCH', url, body)
};

/**
 * Loads a collection, treating "this role may not read it" as an empty
 * collection rather than an error — a Cashier simply has no lab worklist.
 * Any other failure propagates so it can be shown to the user.
 */
export async function loadCollection<T>(url: string): Promise<T[]> {
  try {
    const response = await api.get<ListResponse<T>>(url);
    return Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    if (error instanceof ApiError && (error.isForbidden || error.isUnauthenticated)) return [];
    console.error(`Failed to load ${url}:`, error);
    return [];
  }
}
