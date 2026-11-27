const inFlight = new Map<string, Promise<unknown>>();

/**
 * Runs `start` once per key at a time: a caller that asks for a key whose
 * work is still running gets that same promise instead of starting it again.
 * The key is freed when the work settles, so a later call starts fresh.
 */
export function shareInFlight<T>(key: string, start: () => Promise<T>): Promise<T> {
  const running = inFlight.get(key);
  if (running) return running as Promise<T>;

  const promise = start().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}
