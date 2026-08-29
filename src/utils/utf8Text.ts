const MOJIBAKE_MARKERS = /(?:Ã.|Â.|â€|ï»¿)/u;

export const repairUtf8Mojibake = (value: string): string => {
  if (!MOJIBAKE_MARKERS.test(value)) return value;

  const codePoints = Array.from(value, (character) => character.charCodeAt(0));
  if (codePoints.some((codePoint) => codePoint > 255)) return value;

  try {
    const repaired = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(codePoints)
    );

    return MOJIBAKE_MARKERS.test(repaired) ? value : repaired;
  } catch {
    return value;
  }
};

export const normalizeUtf8Text = <T>(value: T): T => {
  if (typeof value === "string") {
    return repairUtf8Mojibake(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeUtf8Text(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeUtf8Text(item)])
    ) as T;
  }

  return value;
};
