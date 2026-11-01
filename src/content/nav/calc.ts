/**
 * The navigation calculators. Every rule here comes from a supplied source (the Shearwater navigation decks, the Oileáin
 * guide's way of giving times, or the BST note on the trip planner), and the page shows the formula, units and assumptions next
 * to each one. They are plain arithmetic on what the user types: nothing is fetched and nothing is looked up.
 * A result is only as good as the values entered, so each calculator says to check against the chart and tables.
 */

export type Parsed = { ok: true; value: number } | { ok: false; message: string };

/** Reads a number the way people type it: "2.5", "2,5" or " 2 ". Signs only where `allowNegative` is set. */
export function parseNumber(text: string, opts: { min?: number; max?: number; allowNegative?: boolean; label?: string } = {}): Parsed {
  const label = opts.label ?? 'This value';
  const cleaned = text.trim().replace(',', '.');
  if (cleaned === '') return { ok: false, message: `${label} is empty. Enter a number.` };
  if (!opts.allowNegative && /^-\d/.test(cleaned)) return { ok: false, message: `${label} cannot be negative.` };
  const pattern = opts.allowNegative ? /^-?\d+(\.\d+)?$/ : /^\d+(\.\d+)?$/;
  if (!pattern.test(cleaned)) return { ok: false, message: `${label} must be a number, for example 2.5.` };
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return { ok: false, message: `${label} must be a number, for example 2.5.` };
  if (opts.min !== undefined && value < opts.min) return { ok: false, message: `${label} must be at least ${opts.min}.` };
  if (opts.max !== undefined && value > opts.max) return { ok: false, message: `${label} must be no more than ${opts.max}.` };
  return { ok: true, value };
}

const round = (n: number, places: number) => Math.round((n + Number.EPSILON) * 10 ** places) / 10 ** places;

/* ---------- Rule of thirds: how fast the stream runs in each hour ---------- */

/** Hours 1 to 6 as a fraction of the full rate: 1/3, 2/3, full, full, 2/3, 1/3 (Shearwater Tides deck). */
export const thirdsFractions: { hour: number; fraction: number; label: string }[] = [
  { hour: 1, fraction: 1 / 3, label: '1/3' },
  { hour: 2, fraction: 2 / 3, label: '2/3' },
  { hour: 3, fraction: 1, label: 'full' },
  { hour: 4, fraction: 1, label: 'full' },
  { hour: 5, fraction: 2 / 3, label: '2/3' },
  { hour: 6, fraction: 1 / 3, label: '1/3' },
];

export function ruleOfThirds(maxRateKn: number): { hour: number; label: string; rateKn: number }[] {
  return thirdsFractions.map((t) => ({ hour: t.hour, label: t.label, rateKn: round(maxRateKn * t.fraction, 2) }));
}

/* ---------- Rule of twelfths: how far the tide has risen or fallen ---------- */

/** Twelfths of the range in each hour: 1, 2, 3, 3, 2, 1 (Shearwater Tides deck). */
export const twelfthsPerHour = [1, 2, 3, 3, 2, 1] as const;

export interface TwelfthsRow {
  hour: number;
  changeTwelfths: number;
  cumulativeTwelfths: number;
  heightM: number;
}

/** Height at the end of each hour, rising from low water or falling from high water. The heights are in whatever datum you typed. */
export function ruleOfTwelfths(lowM: number, highM: number, direction: 'rising' | 'falling'): { rangeM: number; rows: TwelfthsRow[] } | null {
  const range = highM - lowM;
  if (!(range > 0)) return null;
  let cumulative = 0;
  const rows = twelfthsPerHour.map((change, i): TwelfthsRow => {
    cumulative += change;
    const moved = (cumulative / 12) * range;
    return {
      hour: i + 1,
      changeTwelfths: change,
      cumulativeTwelfths: cumulative,
      heightM: round(direction === 'rising' ? lowM + moved : highM - moved, 2),
    };
  });
  return { rangeM: round(range, 2), rows };
}

/* ---------- Times from high water, and UT to BST ---------- */

export interface ClockResult {
  time: string;
  /** -1 the day before, 0 the same day, 1 the next day. */
  dayShift: number;
}

export function parseClock(text: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h <= 23 && m <= 59 ? { h, m } : null;
}

export function formatClock(totalMinutes: number): ClockResult {
  const day = 24 * 60;
  const dayShift = Math.floor(totalMinutes / day);
  const wrapped = ((totalMinutes % day) + day) % day;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return { time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, dayShift };
}

/** A time that is some hours and minutes before or after a high water time (a local port, or the start of a stream). */
export function timeFromHighWater(hw: string, direction: 'before' | 'after', hours: number, minutes: number): ClockResult | null {
  const clock = parseClock(hw);
  if (!clock) return null;
  const offset = hours * 60 + minutes;
  return formatClock(clock.h * 60 + clock.m + (direction === 'after' ? offset : -offset));
}

/** Adds one hour, for a tide table given in universal time on a date when British Summer Time applies. */
export function addOneHour(time: string): ClockResult | null {
  const clock = parseClock(time);
  return clock ? formatClock(clock.h * 60 + clock.m + 60) : null;
}

export function dayShiftNote(shift: number): string {
  return shift === 0 ? '' : shift > 0 ? ' (the next day)' : ' (the day before)';
}

/* ---------- Offset for a current ---------- */

export type CurrentKind = 'beam' | 'quarter';

export type OffsetResult =
  | { ok: true; degrees: number; ratio: number; factor: number }
  | { ok: false; message: string };

/**
 * Offset angle to allow for a stream (Shearwater Pilotage deck): angle = (stream speed / paddling speed) x 60 degrees for a
 * stream on the beam, and x 40 degrees for a stream on the bow or quarter.
 */
export function currentOffset(currentKn: number, paddleKn: number, kind: CurrentKind): OffsetResult {
  if (!(paddleKn > 0)) return { ok: false, message: 'Paddling speed must be more than zero.' };
  if (currentKn < 0) return { ok: false, message: 'Stream speed cannot be negative.' };
  if (currentKn >= paddleKn) {
    return {
      ok: false,
      message: 'The stream is as fast as you paddle or faster, so no offset angle will hold your course. This rule does not apply.',
    };
  }
  const factor = kind === 'beam' ? 60 : 40;
  const ratio = currentKn / paddleKn;
  return { ok: true, degrees: round(ratio * factor, 1), ratio: round(ratio, 3), factor };
}

/* ---------- Stream speed from distance and time ---------- */

export interface StreamSpeed {
  groundSpeedKn: number;
  streamKn: number;
  direction: 'with' | 'against' | 'none';
}

/** Ground speed = distance / time. Stream speed = ground speed - your speed through the water (Shearwater Pilotage deck). */
export function streamSpeed(distanceNm: number, minutes: number, boatKn: number): StreamSpeed | null {
  if (!(distanceNm > 0) || !(minutes > 0) || boatKn < 0) return null;
  const sog = distanceNm / (minutes / 60);
  const stream = sog - boatKn;
  const rounded = round(Math.abs(stream), 2);
  return { groundSpeedKn: round(sog, 2), streamKn: rounded, direction: rounded === 0 ? 'none' : stream > 0 ? 'with' : 'against' };
}

/* ---------- Reading a tidal stream atlas ---------- */

/** An atlas prints a rate as two numbers with a comma, "12,23": 1.2 knots at neaps and 2.3 knots at springs (Shearwater Tides deck). */
export function decodeAtlasRate(text: string): { neapsKn: number; springsKn: number } | null {
  const match = /^\s*(\d{2}),(\d{2})\s*$/.exec(text);
  if (!match) return null;
  return { neapsKn: Number(match[1]) / 10, springsKn: Number(match[2]) / 10 };
}

/* ---------- Cables and nautical miles ---------- */

/** 1 nautical mile = 10 cables, and 1 minute of latitude = 1 nautical mile (Shearwater Chartwork deck). */
export function cablesToNm(cables: number): number {
  return round(cables / 10, 3);
}

export function nmToCables(nm: number): number {
  return round(nm * 10, 2);
}
