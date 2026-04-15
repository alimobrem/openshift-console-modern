/**
 * Safe query wrapper — returns null for 404 (resource doesn't exist),
 * throws for 500/network errors so React Query shows error banners.
 */
export async function safeQuery<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    // 404 = resource legitimately doesn't exist
    if (e instanceof Response && e.status === 404) return null;
    // Check for fetch Response-like objects
    if (typeof e === 'object' && e !== null && 'status' in e) {
      const status = (e as { status: number }).status;
      if (status === 404) return null;
    }
    throw e; // Let React Query handle the error
  }
}
