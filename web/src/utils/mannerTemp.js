export const TRUST_LEVELS = {
  DANGER: { label: '위험', color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' },
  WARNING: { label: '주의', color: 'text-orange-500', bg: 'bg-orange-50', ring: 'ring-orange-200' },
  NORMAL: { label: '보통', color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  GOOD: { label: '우수', color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  EXCELLENT: { label: '최우수', color: 'text-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-200' },
};

export function tempColor(temp) {
  if (temp >= 40) return 'text-red-500';
  if (temp >= 37.5) return 'text-orange-500';
  return 'text-blue-500';
}

export function tempBg(temp) {
  if (temp >= 40) return 'bg-red-500';
  if (temp >= 37.5) return 'bg-orange-400';
  return 'bg-blue-500';
}

export function trustMeta(level) {
  return TRUST_LEVELS[level] || TRUST_LEVELS.NORMAL;
}
