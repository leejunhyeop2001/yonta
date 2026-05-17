export const SLOT_MINUTES = 10;

export function toSlotStartMs(dateMs: number) {
  const slotSizeMs = SLOT_MINUTES * 60 * 1000;
  return Math.floor(dateMs / slotSizeMs) * slotSizeMs;
}

export function toNextSlotStartMs(dateMs: number) {
  const slotSizeMs = SLOT_MINUTES * 60 * 1000;
  return toSlotStartMs(dateMs + slotSizeMs);
}

export function formatKST(ms: number) {
  // device locale may vary; keep readable
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

