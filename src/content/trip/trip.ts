import { applicableGroups, dayGroups, MAX_DAYS, MAX_STOPS, tripGroups, tripTypeInfo, type TripType } from './fields';
import { limitDefs, limitKey } from './limits';

/** Where a stored value came from. Everything is typed by the user today; a later planner can add other sources. */
export type ValueSource = 'user';

export interface Stop {
  place: string;
  notes: string;
  eta: string;
  etd: string;
}

export interface TripDay {
  values: Record<string, string>;
  sources: Record<string, ValueSource>;
  stops: Stop[];
}

export interface Trip {
  id: string;
  type: TripType;
  createdAt: string;
  updatedAt: string;
  values: Record<string, string>;
  sources: Record<string, ValueSource>;
  days: TripDay[];
  limitsOn: boolean;
  checks: Record<string, boolean>;
}

export type TripStore = Record<string, Trip>;

export const MAX_TRIPS = 40;
export const MAX_TEXT = 3000;
const MAX_KEYS = 80;

export function newDay(): TripDay {
  return { values: {}, sources: {}, stops: [] };
}

export function createTrip(type: TripType, id: string, now: Date = new Date()): Trip {
  const stamp = now.toISOString();
  return {
    id,
    type,
    createdAt: stamp,
    updatedAt: stamp,
    values: {},
    sources: {},
    days: type === 'day' ? [newDay()] : [newDay(), newDay()],
    limitsOn: false,
    checks: {},
  };
}

/** A new id: a letter then lowercase letters and digits, because addresses in the app are not case-sensitive. */
export function newTripId(random: () => number = Math.random, now: Date = new Date()): string {
  return `t${now.getTime().toString(36)}${Math.floor(random() * 36 ** 3).toString(36).padStart(3, '0')}`;
}

export function isTripId(id: string): boolean {
  return /^t[a-z0-9]{3,24}$/.test(id);
}

export function touch(trip: Trip, now: Date = new Date()): Trip {
  return { ...trip, updatedAt: now.toISOString() };
}

export function setTripValue(trip: Trip, field: string, value: string, now: Date = new Date()): Trip {
  const v = value.slice(0, MAX_TEXT);
  return touch({ ...trip, values: { ...trip.values, [field]: v }, sources: { ...trip.sources, [field]: 'user' } }, now);
}

export function setDayValue(trip: Trip, dayIndex: number, field: string, value: string, now: Date = new Date()): Trip {
  if (dayIndex < 0 || dayIndex >= trip.days.length) return trip;
  const v = value.slice(0, MAX_TEXT);
  const days = trip.days.map((d, i) =>
    i === dayIndex ? { ...d, values: { ...d.values, [field]: v }, sources: { ...d.sources, [field]: 'user' as const } } : d,
  );
  return touch({ ...trip, days }, now);
}

export function setLimitsOn(trip: Trip, on: boolean, now: Date = new Date()): Trip {
  return touch({ ...trip, limitsOn: on }, now);
}

export function setCheck(trip: Trip, itemId: string, checked: boolean, now: Date = new Date()): Trip {
  const checks = { ...trip.checks };
  if (checked) checks[itemId] = true;
  else delete checks[itemId];
  return touch({ ...trip, checks }, now);
}

export function addDay(trip: Trip, now: Date = new Date()): Trip {
  if (trip.type === 'day' || trip.days.length >= MAX_DAYS) return trip;
  return touch({ ...trip, days: [...trip.days, newDay()] }, now);
}

export function removeDay(trip: Trip, dayIndex: number, now: Date = new Date()): Trip {
  if (trip.type === 'day' || trip.days.length <= 2 || dayIndex < 0 || dayIndex >= trip.days.length) return trip;
  return touch({ ...trip, days: trip.days.filter((_, i) => i !== dayIndex) }, now);
}

export function addStop(trip: Trip, dayIndex: number, now: Date = new Date()): Trip {
  const day = trip.days[dayIndex];
  if (!day || day.stops.length >= MAX_STOPS) return trip;
  const days = trip.days.map((d, i) => (i === dayIndex ? { ...d, stops: [...d.stops, { place: '', notes: '', eta: '', etd: '' }] } : d));
  return touch({ ...trip, days }, now);
}

export function updateStop(trip: Trip, dayIndex: number, stopIndex: number, patch: Partial<Stop>, now: Date = new Date()): Trip {
  const day = trip.days[dayIndex];
  if (!day || stopIndex < 0 || stopIndex >= day.stops.length) return trip;
  const clipped: Partial<Stop> = {};
  for (const k of ['place', 'notes', 'eta', 'etd'] as const) if (patch[k] !== undefined) clipped[k] = patch[k]!.slice(0, MAX_TEXT);
  const stops = day.stops.map((s, i) => (i === stopIndex ? { ...s, ...clipped } : s));
  const days = trip.days.map((d, i) => (i === dayIndex ? { ...d, stops } : d));
  return touch({ ...trip, days }, now);
}

export function removeStop(trip: Trip, dayIndex: number, stopIndex: number, now: Date = new Date()): Trip {
  const day = trip.days[dayIndex];
  if (!day) return trip;
  const days = trip.days.map((d, i) => (i === dayIndex ? { ...d, stops: d.stops.filter((_, j) => j !== stopIndex) } : d));
  return touch({ ...trip, days }, now);
}

const blank = (v: string | undefined) => v === undefined || v.trim() === '';

export interface Gap {
  /** "Trip" or "Day 2". */
  scope: string;
  label: string;
  /** Element id of the field, so the page can link to it. */
  fieldId: string;
  /** Day index, or -1 for a whole-trip field. */
  dayIndex: number;
}

export const tripFieldId = (field: string) => `trip-${field}`;
export const dayFieldId = (dayIndex: number, field: string) => `day${dayIndex + 1}-${field}`;

/** Everything the plan still needs, in the order the fields appear. */
export function tripGaps(trip: Trip): Gap[] {
  const gaps: Gap[] = [];
  for (const g of applicableGroups(tripGroups, trip.type)) {
    for (const f of g.fields) {
      if (f.required && blank(trip.values[f.id])) gaps.push({ scope: 'Trip', label: f.label, fieldId: tripFieldId(f.id), dayIndex: -1 });
    }
  }
  const dayGroupsForType = applicableGroups(dayGroups, trip.type);
  trip.days.forEach((day, i) => {
    for (const g of dayGroupsForType) {
      for (const f of g.fields) {
        if (f.required && blank(day.values[f.id])) {
          gaps.push({ scope: trip.type === 'day' ? 'Trip' : `Day ${i + 1}`, label: f.label, fieldId: dayFieldId(i, f.id), dayIndex: i });
        }
      }
    }
  });
  if (trip.limitsOn) {
    for (const def of limitDefs) {
      if (def.id !== 'race' && blank(trip.values[limitKey(def.id)])) {
        gaps.push({ scope: 'Limit check', label: def.label, fieldId: tripFieldId(limitKey(def.id).replace('.', '-')), dayIndex: -1 });
      }
    }
  }
  return gaps;
}

export function gapsForDay(trip: Trip, dayIndex: number): number {
  return tripGaps(trip).filter((g) => g.dayIndex === dayIndex).length;
}

/** A short name for lists and file names. */
export function tripTitle(trip: Trip): string {
  const name = (trip.values.name ?? '').trim();
  return name || `Untitled ${tripTypeInfo(trip.type).short.toLowerCase()}`;
}

/** The first day's date, or '' if there is none. */
export function tripDateRange(trip: Trip): string {
  const dates = trip.days.map((d) => d.values.date ?? '').filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if (dates.length === 0) return '';
  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  return first === last ? first : `${first} to ${last}`;
}

/* ---------- Validation, used when reading saved data and import files ---------- */

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isShortString = (x: unknown, max = MAX_TEXT): x is string => typeof x === 'string' && x.length <= max;
const isStringMap = (x: unknown): x is Record<string, string> =>
  isObj(x) && Object.keys(x).length <= MAX_KEYS && Object.entries(x).every(([k, v]) => k.length <= 40 && isShortString(v));
const isSourceMap = (x: unknown): boolean => isObj(x) && Object.keys(x).length <= MAX_KEYS && Object.values(x).every((v) => v === 'user');

function isStop(x: unknown): x is Stop {
  return isObj(x) && isShortString(x.place) && isShortString(x.notes) && isShortString(x.eta) && isShortString(x.etd);
}

function isDay(x: unknown): x is TripDay {
  return isObj(x) && isStringMap(x.values) && isSourceMap(x.sources) && Array.isArray(x.stops) && x.stops.length <= MAX_STOPS && x.stops.every(isStop);
}

export function isTrip(x: unknown): x is Trip {
  if (!isObj(x)) return false;
  if (typeof x.id !== 'string' || !isTripId(x.id)) return false;
  if (x.type !== 'day' && x.type !== 'multi-day' && x.type !== 'camping') return false;
  if (!isShortString(x.createdAt, 40) || !isShortString(x.updatedAt, 40)) return false;
  if (!isStringMap(x.values) || !isSourceMap(x.sources)) return false;
  if (typeof x.limitsOn !== 'boolean') return false;
  if (!isObj(x.checks) || Object.keys(x.checks).length > 100 || !Object.values(x.checks).every((v) => v === true)) return false;
  if (!Array.isArray(x.days) || !x.days.every(isDay)) return false;
  if (x.type === 'day' ? x.days.length !== 1 : x.days.length < 2 || x.days.length > MAX_DAYS) return false;
  return true;
}

export function isTripStore(x: unknown): x is TripStore {
  if (!isObj(x)) return false;
  const entries = Object.entries(x);
  if (entries.length > MAX_TRIPS) return false;
  return entries.every(([key, trip]) => isTrip(trip) && trip.id === key);
}

/** Import merge: imported trips replace saved ones with the same id and the rest are kept. Null if that would be too many trips. */
export function mergeTripStores(existing: unknown, incoming: unknown): TripStore | null {
  const base = isTripStore(existing) ? existing : {};
  if (!isTripStore(incoming)) return null;
  const merged = { ...base, ...incoming };
  return Object.keys(merged).length > MAX_TRIPS ? null : merged;
}
