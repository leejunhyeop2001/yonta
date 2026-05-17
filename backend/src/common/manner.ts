export function mannerScoreToTemp(score: number): number {
  return 36.5 + (score - 100) * 0.05;
}

export function tempToMannerScore(temp: number): number {
  return Math.round(100 + (temp - 36.5) / 0.05);
}

export function trustLevelFromScore(score: number): {
  level: string;
  label: string;
} {
  const temp = mannerScoreToTemp(score);
  if (temp >= 38) return { level: 'EXCELLENT', label: '최우수' };
  if (temp >= 37) return { level: 'GOOD', label: '우수' };
  if (temp < 36) return { level: 'WARNING', label: '주의' };
  if (temp < 35) return { level: 'DANGER', label: '위험' };
  return { level: 'NORMAL', label: '보통' };
}

export function ratingToMannerDelta(rating: number): number {
  return (rating - 3) * 4;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || !local) return '***';
  return `${local.slice(0, 1)}***@${domain}`;
}

export function studentIdFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  return /^\d+$/.test(local) ? local : local.slice(0, 8);
}
