/**
 * Risk assessment: a plain generic layout (hazard, who or what could be harmed, controls, further action, who, done),
 * plus hazard prompts that each cite a source. This is NOT the ECSKC template, which has not been supplied.
 * No scoring system is used, because no supplied source defines one.
 */

export interface HazardPrompt {
  id: string;
  hazard: string;
  why: string;
  source: string;
  where?: string;
}

export const hazardPrompts: HazardPrompt[] = [
  {
    id: 'race',
    hazard: 'Tide race or overfalls',
    why: 'A stream squeezed through a constriction speeds up into a race, and a race passing over an uneven bed makes steep, close, breaking waves. The Sea Kayak Leader remit excludes them.',
    source: 'shearwater',
    where: 'Tides deck: tide race and overfalls',
  },
  {
    id: 'headland',
    hazard: 'Fast stream off a headland',
    why: 'A headland sticking out into a fast stream makes the water speed up off its end.',
    source: 'shearwater',
    where: 'Tides deck: salient points',
  },
  {
    id: 'wind-tide',
    hazard: 'Wind against tide',
    why: 'Wind against the tide steepens the sea; wind with the tide gives a smoother sea.',
    source: 'shearwater',
    where: 'Weather deck: wind against tide',
  },
  {
    id: 'offshore',
    hazard: 'Offshore wind and long fetch',
    why: 'The danger of an offshore wind is not obvious from the shore and gets worse the further out you go. Fetch is the distance the wind has blown without interruption.',
    source: 'shearwater',
    where: 'Weather deck: wind and fetch',
  },
  {
    id: 'surf',
    hazard: 'Surf or dumping waves at launch or landing',
    why: 'Dumping surf traps air under the breaking wave. The leader remit allows launching and landing in surf up to 1 metre, trough to crest.',
    source: 'bcab',
    where: 'p. 3',
  },
  {
    id: 'cold',
    hazard: 'Cold-water immersion and hypothermia',
    why: 'Clothing must be adequate for the risk of hypothermia from cold-water immersion.',
    source: 'ecskc-safety',
  },
  {
    id: 'fog',
    hazard: 'Fog or poor visibility',
    why: 'Fog is part of the warm sector of a depression, and a forecast gives visibility. Check it.',
    source: 'shearwater',
    where: 'Weather deck: frontal system and forecasts',
  },
  {
    id: 'crossing',
    hazard: 'A long open crossing',
    why: 'The leader remit allows crossings no longer than 2 nautical miles. Anything longer is outside it.',
    source: 'bcab',
    where: 'p. 3',
  },
  {
    id: 'access',
    hazard: 'Landing restrictions, military or private land',
    why: 'Oileáin warns of a military zone and firing range beside Lough Foyle (p. 1) and says landing is forbidden on the Muglins off Dalkey Island (p. 44).',
    source: 'oileain',
    where: 'PDF pages 1 and 44',
  },
  {
    id: 'mismatch',
    hazard: 'A trip that does not match the group',
    why: 'The club says to match the trip to the group’s experience, equipment and fitness.',
    source: 'ecskc-safety',
  },
];

export interface RiskRow {
  id: string;
  hazard: string;
  harmed: string;
  controls: string;
  further: string;
  owner: string;
  done: boolean;
}

export interface RiskAssessment {
  header: Record<string, string>;
  rows: RiskRow[];
}

export const riskHeaderFields: { id: string; label: string }[] = [
  { id: 'activity', label: 'Activity or trip' },
  { id: 'location', label: 'Location' },
  { id: 'date', label: 'Date' },
  { id: 'assessor', label: 'Assessed by' },
];

export const MAX_RISK_ROWS = 40;

export function newRow(id: string, hazard = ''): RiskRow {
  return { id, hazard, harmed: '', controls: '', further: '', owner: '', done: false };
}

/** Adds a row, unless the limit is reached or the hazard from a prompt is already on the form. */
export function addRow(rows: RiskRow[], row: RiskRow): RiskRow[] {
  if (rows.length >= MAX_RISK_ROWS) return rows;
  if (row.hazard !== '' && rows.some((r) => r.hazard === row.hazard)) return rows;
  return [...rows, row];
}

export function removeRow(rows: RiskRow[], id: string): RiskRow[] {
  return rows.filter((r) => r.id !== id);
}

export function updateRow(rows: RiskRow[], id: string, patch: Partial<Omit<RiskRow, 'id'>>): RiskRow[] {
  return rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

/** What is still open on the form, for the missing-information list. */
export function riskGaps(a: RiskAssessment): string[] {
  const gaps: string[] = [];
  for (const f of riskHeaderFields) if ((a.header[f.id] ?? '').trim() === '') gaps.push(`${f.label} is blank`);
  if (a.rows.length === 0) gaps.push('No hazards have been listed');
  a.rows.forEach((r, i) => {
    const n = i + 1;
    const name = r.hazard.trim() === '' ? `Row ${n}` : `"${r.hazard.trim()}"`;
    if (r.hazard.trim() === '') gaps.push(`Row ${n} has no hazard`);
    if (r.controls.trim() === '') gaps.push(`${name} has no controls listed`);
  });
  return gaps;
}

export function riskText(a: RiskAssessment): string {
  const out: string[] = ['Risk assessment (generic layout, not the ECSKC template)', ''];
  for (const f of riskHeaderFields) out.push(`${f.label}: ${(a.header[f.id] ?? '').trim() || 'Not filled in'}`);
  a.rows.forEach((r, i) => {
    out.push('');
    out.push(`${i + 1}. ${r.hazard.trim() || '(no hazard named)'}`);
    out.push(`   Who or what could be harmed: ${r.harmed.trim() || 'Not filled in'}`);
    out.push(`   Controls in place: ${r.controls.trim() || 'Not filled in'}`);
    out.push(`   Further action: ${r.further.trim() || 'None noted'}`);
    out.push(`   Responsible: ${r.owner.trim() || 'Not filled in'}`);
    out.push(`   Action done: ${r.done ? 'Yes' : 'No'}`);
  });
  const gaps = riskGaps(a);
  out.push('');
  out.push(gaps.length === 0 ? 'No gaps found.' : `Gaps (${gaps.length}): ${gaps.join('; ')}.`);
  return out.join('\n');
}

export function isRiskAssessment(x: unknown): x is RiskAssessment {
  if (typeof x !== 'object' || x === null) return false;
  const a = x as { header?: unknown; rows?: unknown };
  if (typeof a.header !== 'object' || a.header === null || Array.isArray(a.header)) return false;
  if (!Object.values(a.header as Record<string, unknown>).every((v) => typeof v === 'string')) return false;
  if (!Array.isArray(a.rows) || a.rows.length > MAX_RISK_ROWS) return false;
  return a.rows.every((r) => {
    if (typeof r !== 'object' || r === null) return false;
    const row = r as Record<string, unknown>;
    return (
      typeof row.id === 'string' &&
      typeof row.hazard === 'string' &&
      typeof row.harmed === 'string' &&
      typeof row.controls === 'string' &&
      typeof row.further === 'string' &&
      typeof row.owner === 'string' &&
      typeof row.done === 'boolean'
    );
  });
}
