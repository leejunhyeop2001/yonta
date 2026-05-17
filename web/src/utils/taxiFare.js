export function computePerPersonTaxiFare(totalFare, memberCount) {
  if (totalFare == null || totalFare <= 0 || memberCount <= 0) {
    return { perPersonFare: null, remainder: 0 };
  }
  const perPersonFare = Math.ceil(totalFare / memberCount);
  const remainder = perPersonFare * memberCount - totalFare;
  return { perPersonFare, remainder };
}

export function formatWon(amount) {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `${Number(amount).toLocaleString('ko-KR')}원`;
}
