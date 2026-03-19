export const CACHE_VERSION = 1;

export type CacheEnv = "development" | "production";

export type CacheContext = {
  clientSlug?: string;
  isDevelopment?: boolean;
};

export type CachePayload<T> = {
  version: number;
  ts: number;
  ttlMs: number;
  clientSlug: string;
  env: CacheEnv;
  data: T;
};

export const CACHE_TTLS = {
  cmsComponentsMs: 3 * 60 * 1000,
  programasListMs: 10 * 60 * 1000,
  gobiernoPageMs: 10 * 60 * 1000,
  contactoPageMs: 10 * 60 * 1000,
  noticiasListMs: 5 * 60 * 1000,
  agendaListMs: 5 * 60 * 1000,
} as const;

function getEnv(context?: CacheContext): CacheEnv {
  return context?.isDevelopment ? "development" : "production";
}

function getClientSlug(context?: CacheContext): string {
  return String(context?.clientSlug ?? "").trim();
}

function getStorage(kind: "session" | "local"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function buildScopedCacheKey(baseKey: string, context?: CacheContext): string {
  const slug = getClientSlug(context);
  const env = getEnv(context);
  return `${baseKey}:v${CACHE_VERSION}:${slug}:${env}`;
}

export function isCacheValid<T>(
  payload: Partial<CachePayload<T>> | null | undefined,
  context?: CacheContext
): payload is CachePayload<T> {
  if (!payload || typeof payload !== "object") return false;
  if (payload.version !== CACHE_VERSION) return false;
  if (typeof payload.ts !== "number") return false;
  if (typeof payload.ttlMs !== "number" || payload.ttlMs <= 0) return false;
  if (Date.now() - payload.ts > payload.ttlMs) return false;
  if ((payload.clientSlug ?? "") !== getClientSlug(context)) return false;
  if (payload.env !== getEnv(context)) return false;
  return true;
}

export function getCache<T>(
  baseKey: string,
  context?: CacheContext,
  storageKind: "session" | "local" = "session"
): T | null {
  const storage = getStorage(storageKind);
  if (!storage) return null;
  const key = buildScopedCacheKey(baseKey, context);
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachePayload<T>>;
    if (!isCacheValid(parsed, context)) return null;
    return (parsed as CachePayload<T>).data;
  } catch {
    return null;
  }
}

export function setCache<T>(
  baseKey: string,
  data: T,
  context: CacheContext | undefined,
  ttlMs: number,
  storageKind: "session" | "local" = "session"
): void {
  const storage = getStorage(storageKind);
  if (!storage) return;
  const key = buildScopedCacheKey(baseKey, context);
  const payload: CachePayload<T> = {
    version: CACHE_VERSION,
    ts: Date.now(),
    ttlMs,
    clientSlug: getClientSlug(context),
    env: getEnv(context),
    data,
  };
  try {
    storage.setItem(key, JSON.stringify(payload));
  } catch {
    /* noop */
  }
}

export function clearCache(baseKey: string, context?: CacheContext): void {
  const session = getStorage("session");
  const local = getStorage("local");
  const key = buildScopedCacheKey(baseKey, context);
  try {
    session?.removeItem(key);
    local?.removeItem(key);
  } catch {
    /* noop */
  }
}

export function clearByPrefix(prefix: string): void {
  const storages = [getStorage("session"), getStorage("local")].filter(
    Boolean
  ) as Storage[];
  for (const storage of storages) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key && key.startsWith(prefix)) keys.push(key);
      }
      keys.forEach((k) => storage.removeItem(k));
    } catch {
      /* noop */
    }
  }
}
