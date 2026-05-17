import Constants from 'expo-constants';

export function getApiBaseUrl() {
  return String(Constants.expoConfig?.extra?.API_BASE_URL ?? '');
}

export function getSocketBaseUrl() {
  return String(Constants.expoConfig?.extra?.SOCKET_BASE_URL ?? '');
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function apiFetch<T>(
  path: string,
  opts: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    token?: string | null;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error('API_BASE_URL is empty. Check app.json extra.');

  const url = new URL(path, baseUrl);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      method: opts.method ?? (opts.body ? 'POST' : 'GET'),
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    const err = e as Error;
    if (err.name === 'AbortError') {
      throw new Error(
        `요청 시간 초과(${timeoutMs / 1000}초). 서버가 켜져 있는지, 폰과 맥이 같은 Wi‑Fi인지, app.json의 API_BASE_URL(맥 IP)이 맞는지 확인하세요.`,
      );
    }
    throw new Error(
      err.message === 'Network request failed'
        ? '네트워크 요청 실패. 맥 IP·백엔드 실행·Wi‑Fi를 확인하세요.'
        : err.message,
    );
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('로그인이 만료되었습니다. 다시 OTP 로그인해 주세요.');
    }
    throw new Error((data as { message?: string })?.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

