// One queue per server process limits overlapping quiz, map, and chat requests.
// Groq quotas are organization-wide, so its Retry-After remains authoritative.
let queue = Promise.resolve();
let nextStartAt = 0;

export async function serializeAi<T>(work: () => Promise<T>): Promise<T> {
  const previous = queue;
  let release: () => void = () => {};
  queue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    return await work();
  } finally { release(); }
}

export async function paceAi() {
  const delay = nextStartAt - Date.now();
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  nextStartAt = Date.now() + 2100;
}

export function retryDelay(headers: Record<string, string> | undefined, attempt: number, now = Date.now()) {
  const value = headers?.["retry-after"];
  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000) + 250;
    const date = Date.parse(value);
    if (Number.isFinite(date)) return Math.max(0, date - now) + 250;
  }
  // Only token-reset is a minute window; Groq request-reset refers to daily quota.
  const reset = headers?.["x-ratelimit-reset-tokens"];
  if (reset) {
    const matches = [...reset.matchAll(/(\d+(?:\.\d+)?)\s*(ms|h|m|s)/g)];
    const multipliers: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };
    const delay = matches.reduce((total, match) => total + Number(match[1]) * multipliers[match[2]], 0);
    if (delay > 0) return Math.ceil(delay) + 250;
  }
  return 3000 * 2 ** attempt;
}
