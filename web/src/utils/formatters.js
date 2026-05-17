const KST = 'Asia/Seoul';

/** YYYY-MM-DD (한국 날짜) */
export function getKstDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** ISO/UTC 저장값 → 한국 시각 HH:mm */
export function getHHmmKST(isoDateTime) {
  if (!isoDateTime) return '00:00';
  const d = new Date(isoDateTime);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: KST,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h}:${m}`;
}

export function toDateKeyKST(isoDateTime) {
  if (!isoDateTime) return getKstDateString();
  return getKstDateString(new Date(isoDateTime));
}

export function formatDateTimeKST(isoDateTime) {
  if (!isoDateTime) return '';
  const d = new Date(isoDateTime);
  const md = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    month: 'numeric',
    day: 'numeric',
  }).format(d);
  return `${md} ${getHHmmKST(isoDateTime)}`;
}

export function formatDate(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const wd = new Intl.DateTimeFormat('ko-KR', { timeZone: KST, weekday: 'short' }).format(date);
  const dayNum = new Intl.DateTimeFormat('ko-KR', { timeZone: KST, day: 'numeric' }).format(date);
  const monthNum = new Intl.DateTimeFormat('ko-KR', { timeZone: KST, month: 'numeric' }).format(date);
  return `${monthNum}/${dayNum}(${wd})`;
}

export function isToday(dateStr) {
  return dateStr === getKstDateString();
}

export function isTomorrow(dateStr) {
  const tom = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return dateStr === getKstDateString(tom);
}

export function getDateLabel(dateStr) {
  if (isToday(dateStr)) return '오늘';
  if (isTomorrow(dateStr)) return '내일';
  return formatDate(dateStr);
}

export function getNextDays(count = 7) {
  const days = [];
  const base = Date.now();
  for (let i = 0; i < count; i++) {
    days.push(getKstDateString(new Date(base + i * 24 * 60 * 60 * 1000)));
  }
  return days;
}
