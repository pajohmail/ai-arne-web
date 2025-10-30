export type Json = Record<string, unknown> | unknown[];

const cache = new Map<string, { data: unknown; ts: number }>();
const DEFAULT_TTL_MS = 60_000; // 1 min per session

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? 15_000);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getJsonCached<T = Json>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now - hit.ts < ttlMs) {
    return hit.data as T;
  }
  const data = await fetcher();
  cache.set(key, { data, ts: now });
  return data;
}


