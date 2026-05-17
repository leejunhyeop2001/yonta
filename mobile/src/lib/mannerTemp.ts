export const TRUST_LEVELS = {
  DANGER: { label: '위험', color: '#DC2626', bg: '#FEF2F2' },
  WARNING: { label: '주의', color: '#EA580C', bg: '#FFF7ED' },
  NORMAL: { label: '보통', color: '#2563EB', bg: '#EFF6FF' },
  GOOD: { label: '우수', color: '#059669', bg: '#ECFDF5' },
  EXCELLENT: { label: '최우수', color: '#7C3AED', bg: '#F5F3FF' },
} as const;

export function tempColor(temp: number) {
  if (temp >= 40) return '#EF4444';
  if (temp >= 37.5) return '#F97316';
  return '#2563EB';
}

export function tempBg(temp: number) {
  if (temp >= 40) return '#EF4444';
  if (temp >= 37.5) return '#FB923C';
  return '#3B82F6';
}

export function trustMeta(level: string) {
  return TRUST_LEVELS[level as keyof typeof TRUST_LEVELS] ?? TRUST_LEVELS.NORMAL;
}
