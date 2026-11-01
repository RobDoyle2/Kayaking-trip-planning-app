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

/**
 * The rule, assumptions and source shown beside each calculator. Kept here so the page and the assistant's library say the same thing.
 */
export interface CalcRule {
  title: string;
  formula: string;
  assumptions: string[];
  source: string;
}

export const calcRules: Record<'fromhw' | 'bst' | 'thirds' | 'twelfths' | 'offset' | 'streamspeed' | 'atlas' | 'cables', CalcRule> = {
  thirds: {
    title: "Rule of thirds: stream rate by hour",
    formula: "Counting the hours of a stream from slack water, the rate in hours 1 to 6 is 1/3, 2/3, full, full, 2/3 and 1/3 of the full rate.",
    assumptions: [
      "The slides give the fractions as \"of flow\". This calculator applies them to the full (maximum) rate that you enter, in knots.",
      "It is a rule of thumb for a stream that runs for about six hours. Real streams vary with the place, so use an atlas or the local guide where you have one.",
      "The hours are counted from slack water, as the slides lay them out.",
    ],
    source: "Shearwater Tides deck (rule of thirds)",
  },
  twelfths: {
    title: "Rule of twelfths: height of the tide by hour",
    formula: "In hours 1 to 6 the tide moves 1, 2, 3, 3, 2 and 1 twelfths of its range.",
    assumptions: [
      "The slides lay the rule out as high water, then one to five hours after, then low water: a six-hour rise or fall.",
      "Heights come out in the datum you type them in. Use the same datum for both heights, and check it before comparing with a charted depth.",
      "It is a rule of thumb, not a tide table. Real tides do not follow it exactly, so use the predicted heights where you have them.",
    ],
    source: "Shearwater Tides deck (rule of twelfths)",
  },
  fromhw: {
    title: "Time from high water: local port high water, or when a stream starts",
    formula: "Time = the high water time at the standard port, plus the offset if it is after, or minus it if it is before.",
    assumptions: [
      "Oileáin and the Shearwater slides give a local high water, or the start of a stream, as hours and minutes before or after high water at a named standard port. This calculator does that sum.",
      "The answer is in the same clock as the time you enter. If your table is in UT and the day is in summer time, add one hour with the BST calculator below.",
      "It uses only the offsets you type. It does not look up any standard port or offset.",
    ],
    source: "Oileáin (standard-port convention, from the supplied PDF) and the Shearwater Tides deck",
  },
  bst: {
    title: "Universal time to British Summer Time",
    formula: "Add one hour.",
    assumptions: [
      "Use it only when the tide table is in universal time (UT or GMT) and the date falls in summer time. Check the time zone the table says it uses before you add an hour, so you do not add it twice or miss it.",
      "The calculator does not know the dates of summer time.",
    ],
    source: "Shearwater Tides deck (the tide table example) and the planner's “+1 hr for BST” box",
  },
  offset: {
    title: "Offset angle for a stream",
    formula: "Angle = (stream speed ÷ paddling speed) × 60° for a stream on the beam, or × 40° for a stream on the bow or quarter.",
    assumptions: [
      "Both speeds in knots, paddling speed through the water. The angle is how far to aim up-stream of your destination, in degrees.",
      "The slides give the factors 60 and 40 and no limits. If the stream is as fast as you paddle, or faster, no angle will hold the course, so the calculator says so instead of giving a number.",
      "A rule of thumb for planning, not a bearing to steer blindly: plot a course to steer on the chart and check it as you go.",
    ],
    source: "Shearwater Pilotage deck (offset for current speed)",
  },
  streamspeed: {
    title: "Speed of a stream from distance and time",
    formula: "Speed over the ground = distance ÷ time. Stream speed = speed over the ground − your speed through the water.",
    assumptions: [
      "Paddle straight along the stream at a steady speed, and measure the distance made good over the ground in nautical miles and the time in minutes.",
      "A positive result means the stream is with you and a negative one means it is against you. The calculator says which.",
      "Your speed through the water has to be known. The slides use 3 knots as an example, and that is a value you enter, not a default.",
    ],
    source: "Shearwater Pilotage deck (estimate the speed of a tidal stream). The slides’ worked example: 0.7 mile in 10 minutes is 4.2 knots, and with a boat speed of 3 knots the stream is 1.2 knots.",
  },
  atlas: {
    title: "Reading a rate on a tidal stream atlas",
    formula: "A rate printed as two numbers with a comma, such as 12,23, means 1.2 knots at neaps and 2.3 knots at springs.",
    assumptions: [
      "The comma stands for the decimal point: the first number is the neap rate and the second the spring rate, each in tenths of a knot.",
      "Enter exactly two digits either side of the comma. Other formats are not decoded.",
    ],
    source: "Shearwater Tides deck (the atlas example: 03,05 is 0.3 knots at neaps and 0.5 knots at springs)",
  },
  cables: {
    title: "Cables and nautical miles",
    formula: "1 nautical mile = 10 cables. One minute of latitude is one nautical mile.",
    assumptions: [
      "Measure distance on the latitude scale at the side of the chart, never on the longitude scale.",
      "The slides’ worked example: 8.5 cables is 0.85 nautical miles.",
    ],
    source: "Shearwater Chartwork deck",
  },
};
