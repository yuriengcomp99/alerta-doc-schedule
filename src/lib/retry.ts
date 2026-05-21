const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  label: string,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt >= maxAttempts) break;
      const delayMs = 1000 * attempt;
      console.warn(
        `[retry] ${label} falhou (tentativa ${attempt}/${maxAttempts}), nova tentativa em ${delayMs}ms`,
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}
