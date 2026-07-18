function timestamp(value, { endOfDate = false } = {}) {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T${endOfDate ? '23:59:59.999' : '00:00:00.000'}Z`
    : value;
  const result = Date.parse(normalized);
  return Number.isFinite(result) ? result : null;
}

export function calculateEventStatus(event, { now = new Date(), endingSoonHours = 72 } = {}) {
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const startMs = timestamp(event.event_start);
  const endMs = timestamp(event.event_end, { endOfDate: true });
  if (!Number.isFinite(nowMs) || (startMs === null && endMs === null)) return 'unknown';
  if (startMs !== null && nowMs < startMs) return 'upcoming';
  if (endMs !== null && nowMs > endMs) return 'ended';
  if (endMs !== null && endMs - nowMs <= endingSoonHours * 60 * 60 * 1000) return 'ending-soon';
  if (startMs !== null || endMs !== null) return 'active';
  return 'unknown';
}
