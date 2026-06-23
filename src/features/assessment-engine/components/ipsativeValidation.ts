export const validateIpsativeAnswer = (
  value: Record<string, number>,
  optionIds?: string[]
): boolean => {
  if (!value) {
    return false;
  }

  const ranks = Object.values(value);

  if (ranks.length === 0) {
    return false;
  }

  const expectedRanks = optionIds
    ? optionIds.map((_, index) => index + 1)
    : ranks.map((_, index) => index + 1);

  return expectedRanks.every((rank) => ranks.includes(rank));
};
