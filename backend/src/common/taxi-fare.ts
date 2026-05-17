export function computePerPersonTaxiFare(totalFare: number | null | undefined, memberCount: number) {
  if (totalFare == null || totalFare <= 0 || memberCount <= 0) {
    return { perPersonFare: null as number | null, remainder: 0 };
  }
  const perPersonFare = Math.ceil(totalFare / memberCount);
  const remainder = perPersonFare * memberCount - totalFare;
  return { perPersonFare, remainder };
}
