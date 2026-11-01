/**
 * Optional check against the Sea Kayak Leader award limits. Information only: it never blocks anything,
 * never says a trip is safe or unsafe, and the limits belong to the award, not to ECSKC or to this app.
 * Source: BCAB Sea Kayak Leader Assessment Guidance, March 2024 edition, page 3 (the October 2021 edition gives the same figures).
 */

export interface LimitDef {
  id: 'landing' | 'crossing' | 'stream' | 'beaufort' | 'race';
  label: string;
  unit: string;
  /** Numeric limit; the check flags values strictly above it. */
  limit?: number;
  hint: string;
}

export const limitDefs: LimitDef[] = [
  { id: 'landing', label: 'Longest distance between landing places', unit: 'NM', limit: 2, hint: 'Nautical miles.' },
  { id: 'crossing', label: 'Longest open crossing', unit: 'NM', limit: 2, hint: 'Nautical miles.' },
  { id: 'stream', label: 'Strongest tidal stream expected', unit: 'kn', limit: 2, hint: 'Knots.' },
  { id: 'beaufort', label: 'Highest wind forecast', unit: 'Beaufort force', limit: 4, hint: 'A force number, 0 to 12.' },
  { id: 'race', label: 'A tide race or overfalls is on the route', unit: '', hint: 'Tick if there is one.' },
];

export const limitSource = 'BCAB Sea Kayak Leader guidance, page 3';

export type LimitStatus = 'within' | 'over' | 'missing' | 'invalid' | 'flagged' | 'none';

export interface LimitFinding {
  id: LimitDef['id'];
  label: string;
  status: LimitStatus;
  message: string;
}

export const limitKey = (id: string) => `lim.${id}`;

function parseNumber(text: string): number | null {
  const cleaned = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Compares what the user typed with the award limits. Strictly above a limit is flagged. */
export function limitFindings(values: Record<string, string>): LimitFinding[] {
  return limitDefs.map((def): LimitFinding => {
    const raw = values[limitKey(def.id)] ?? '';
    if (def.id === 'race') {
      return raw === 'yes'
        ? { id: def.id, label: def.label, status: 'flagged', message: 'A tide race or overfalls is on the route. The award limits say no race or overfalls.' }
        : { id: def.id, label: def.label, status: 'none', message: 'No tide race or overfalls entered.' };
    }
    if (raw.trim() === '') return { id: def.id, label: def.label, status: 'missing', message: 'Not entered, so not checked.' };
    const n = parseNumber(raw);
    if (n === null) return { id: def.id, label: def.label, status: 'invalid', message: `“${raw.trim().slice(0, 20)}” is not a number, so not checked.` };
    const limit = def.limit as number;
    // "4 NM", "2 kn", but "Beaufort force 4" reads better than "4 Beaufort force".
    const say = (n: string | number) => (def.unit === 'Beaufort force' ? `Beaufort force ${n}` : `${n} ${def.unit}`);
    return n > limit
      ? { id: def.id, label: def.label, status: 'over', message: `${say(raw.trim())} is above the award limit of ${say(limit)}.` }
      : { id: def.id, label: def.label, status: 'within', message: `${say(raw.trim())} is within the award limit of ${say(limit)}.` };
  });
}

export function limitsExceeded(values: Record<string, string>): number {
  return limitFindings(values).filter((f) => f.status === 'over' || f.status === 'flagged').length;
}
