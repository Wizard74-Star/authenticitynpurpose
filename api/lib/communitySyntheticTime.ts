const MIN_GAP_MS = 60_000;

export function getSyntheticTimestampRange(lastCreatedAtMs: number | null): { minMs: number; maxMs: number } {
  const maxMs = Date.now();
  let minMs = lastCreatedAtMs ?? maxMs - 7 * 24 * 60 * 60 * 1000;
  if (minMs >= maxMs - MIN_GAP_MS) {
    minMs = maxMs - MIN_GAP_MS;
  }
  return { minMs, maxMs };
}

/** Spread timestamps across (minMs, maxMs] for ordered items. */
export function staggerTimestamps(count: number, minMs: number, maxMs: number): number[] {
  if (count <= 0) return [];
  const span = Math.max(maxMs - minMs, MIN_GAP_MS);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const fraction = (i + 1) / (count + 1);
    result.push(Math.floor(minMs + span * fraction));
  }
  return result;
}

export function replyTimestampAfterPost(postMs: number, maxMs: number): number {
  const latest = maxMs - 30_000;
  const earliest = postMs + MIN_GAP_MS;
  if (earliest >= latest) return Math.min(postMs + MIN_GAP_MS, maxMs);
  return Math.floor(earliest + Math.random() * (latest - earliest));
}

export function toIso(ms: number): string {
  return new Date(ms).toISOString();
}
