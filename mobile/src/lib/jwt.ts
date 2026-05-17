type JwtPayload = { sub?: string; email?: string; exp?: number };

/** Decode JWT payload (no verify) for display only. */
export function decodeJwtPayload(token: string): JwtPayload {
  try {
    const part = token.split('.')[1];
    if (!part) return {};
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const json = globalThis.atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return {};
  }
}

/** 만료됐으면 true (여유 30초) */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const { exp } = decodeJwtPayload(token);
  if (!exp) return false;
  return exp * 1000 < Date.now() + 30_000;
}
