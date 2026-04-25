type LimitState = {
  count: number;
  windowStartsAt: number;
  windowMs: number;
};

const limitStore = new Map<string, LimitState>();

const CleanUpTime = 30;
const ChatLimit = 5;
const AuthLimit = 3;

export function createRateLimiter(limit: number, windowMs: number){
  return (key: string) => {
    const now = Date.now();
    const state = limitStore.get(key);
    if (!state || now - state.windowStartsAt >= windowMs){
      limitStore.set(key, { count: 1, windowStartsAt: now, windowMs });
      return { allowed: true as const, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (state.count >= limit) return { allowed: false as const, remaining: 0, resetAt: state.windowStartsAt + windowMs };

    state.count += 1;
    return { allowed: true as const, remaining: limit - state.count, resetAt: state.windowStartsAt + windowMs };
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, state] of limitStore){
    if (now - state.windowStartsAt > state.windowMs) limitStore.delete(key);
  }
}, CleanUpTime * 1000);

export const authRateLimit = createRateLimiter(AuthLimit, 30 * 1000);
export const chatRateLimit = createRateLimiter(ChatLimit, 60 * 1000);
