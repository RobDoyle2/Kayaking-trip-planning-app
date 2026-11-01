/** Small type checks for data read back from saved files. Saved data is never trusted. */

export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export function isBooleanRecord(x: unknown): x is Record<string, boolean> {
  return isRecord(x) && Object.values(x).every((v) => typeof v === 'boolean');
}

export function isStringRecord(x: unknown): x is Record<string, string> {
  return isRecord(x) && Object.values(x).every((v) => typeof v === 'string');
}

export function isStringOrBooleanRecord(x: unknown): x is Record<string, string | boolean> {
  return isRecord(x) && Object.values(x).every((v) => typeof v === 'string' || typeof v === 'boolean');
}
