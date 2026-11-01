import assert from 'node:assert/strict';
import test from 'node:test';
import { applicableGroups, dayGroups, MAX_DAYS, tripGroups, tripTypes } from './fields';
import { limitFindings, limitsExceeded } from './limits';
import { buildPlan, formatDate, NOT_FILLED, planText } from './output';
import { finalChecklistItems } from './checklist';
import {
  addDay,
  addStop,
  createTrip,
  isTrip,
  isTripId,
  isTripStore,
  mergeTripStores,
  MAX_TRIPS,
  newTripId,
  removeDay,
  removeStop,
  setCheck,
  setDayValue,
  setLimitsOn,
  setTripValue,
  tripGaps,
  tripTitle,
  updateStop,
} from './trip';

const NOW = new Date('2026-11-01T12:00:00Z');
const labels = (trip: ReturnType<typeof createTrip>) => tripGaps(trip).map((g) => `${g.scope}: ${g.label}`);

test('each trip type starts with the right number of days', () => {
  assert.equal(createTrip('day', 'tabc', NOW).days.length, 1);
  assert.equal(createTrip('multi-day', 'tabc', NOW).days.length, 2);
  assert.equal(createTrip('camping', 'tabc', NOW).days.length, 2);
});

test('a day trip cannot gain or lose days; a multi-day trip keeps at least two and at most the maximum', () => {
  const day = createTrip('day', 'tabc', NOW);
  assert.equal(addDay(day).days.length, 1);
  let trip = createTrip('multi-day', 'tabc', NOW);
  for (let i = 0; i < 30; i++) trip = addDay(trip, NOW);
  assert.equal(trip.days.length, MAX_DAYS);
  let small = createTrip('camping', 'tabc', NOW);
  small = removeDay(small, 0, NOW);
  assert.equal(small.days.length, 2, 'cannot go below two days');
  assert.equal(removeDay(addDay(small, NOW), 1, NOW).days.length, 2);
});

test('the three types use different fields, as the specification table says', () => {
  const ids = (type: 'day' | 'multi-day' | 'camping') => ({
    trip: applicableGroups(tripGroups, type).flatMap((g) => g.fields.map((f) => f.id)),
    day: applicableGroups(dayGroups, type).flatMap((g) => g.fields.map((f) => f.id)),
  });
  assert.ok(!ids('day').trip.includes('accommodation'));
  assert.ok(ids('multi-day').trip.includes('accommodation'));
  assert.ok(!ids('camping').trip.includes('accommodation'));
  assert.ok(ids('camping').trip.includes('campGear') && ids('camping').trip.includes('food') && ids('camping').trip.includes('water'));
  assert.ok(!ids('multi-day').trip.includes('campGear'));
  assert.ok(ids('camping').day.includes('campSite') && ids('camping').day.includes('campAccess'));
  assert.ok(!ids('day').day.includes('campSite'));
  for (const t of tripTypes) assert.ok(ids(t.id).day.includes('date'), `${t.id} has a date for every day`);
});

test('a new plan lists everything missing, and filling a field removes it from the list', () => {
  let trip = createTrip('day', 'tabc', NOW);
  const before = labels(trip);
  assert.ok(before.includes('Trip: Trip name') && before.includes('Trip: Launch place') && before.includes('Trip: Tidal streams on the route'));
  trip = setTripValue(trip, 'name', 'Howth loop', NOW);
  trip = setDayValue(trip, 0, 'launch', 'Howth', NOW);
  const after = labels(trip);
  assert.equal(after.length, before.length - 2);
  assert.ok(!after.includes('Trip: Trip name') && !after.includes('Trip: Launch place'));
});

test('whitespace alone counts as blank', () => {
  const trip = setTripValue(createTrip('day', 'tabc', NOW), 'leader', '   ', NOW);
  assert.ok(labels(trip).includes('Trip: Leader'));
});

test('a multi-day plan names the day each gap belongs to, and camping adds camp fields per day', () => {
  const trip = createTrip('camping', 'tabc', NOW);
  const l = labels(trip);
  assert.ok(l.includes('Day 1: Camp site') && l.includes('Day 2: Camp site') && l.includes('Trip: Camping gear'));
  assert.ok(!labels(createTrip('multi-day', 'tabc', NOW)).some((x) => x.includes('Camp site')));
});

test('edited values record where they came from', () => {
  let trip = setTripValue(createTrip('day', 'tabc', NOW), 'name', 'A', NOW);
  trip = setDayValue(trip, 0, 'launch', 'B', NOW);
  assert.equal(trip.sources.name, 'user');
  assert.equal(trip.days[0]!.sources.launch, 'user');
  assert.equal(trip.sources.leader, undefined, 'fields nobody typed in have no source');
});

test('stops can be added, edited and removed, up to a limit', () => {
  let trip = createTrip('day', 'tabc', NOW);
  for (let i = 0; i < 20; i++) trip = addStop(trip, 0, NOW);
  assert.equal(trip.days[0]!.stops.length, 10);
  trip = updateStop(trip, 0, 1, { place: 'Ireland’s Eye', eta: '10:30' }, NOW);
  assert.equal(trip.days[0]!.stops[1]!.place, 'Ireland’s Eye');
  trip = removeStop(trip, 0, 0, NOW);
  assert.equal(trip.days[0]!.stops[0]!.place, 'Ireland’s Eye');
  assert.equal(updateStop(trip, 0, 99, { place: 'x' }, NOW), trip, 'a bad index changes nothing');
});

test('values are clipped to the maximum length', () => {
  const trip = setTripValue(createTrip('day', 'tabc', NOW), 'notes', 'x'.repeat(10000), NOW);
  assert.equal(trip.values.notes!.length, 3000);
  assert.ok(isTrip(trip));
});

test('trip ids are lowercase and validated', () => {
  const id = newTripId(() => 0.5, NOW);
  assert.ok(isTripId(id), id);
  assert.equal(id, id.toLowerCase());
  for (const bad of ['', 'T123', 'x123', 't', 't12', 'a/b', 't1 2', '../x']) assert.ok(!isTripId(bad), bad);
});

test('validation accepts a good store and refuses damaged ones', () => {
  const a = createTrip('day', 'tabc1', NOW);
  const b = createTrip('camping', 'tdef2', NOW);
  assert.ok(isTripStore({ tabc1: a, tdef2: b }));
  assert.ok(isTripStore({}));
  assert.ok(!isTripStore({ tabc1: b }), 'key must match id');
  assert.ok(!isTripStore({ tabc1: { ...a, type: 'boat' } }));
  assert.ok(!isTripStore({ tabc1: { ...a, days: [] } }));
  assert.ok(!isTripStore({ tabc1: { ...a, days: [a.days[0], a.days[0]] } }), 'a day trip has one day');
  assert.ok(!isTripStore({ tdef2: { ...b, days: [b.days[0]] } }), 'a multi-day trip has at least two days');
  assert.ok(!isTripStore({ tabc1: { ...a, values: { name: 5 } } }));
  assert.ok(!isTripStore({ tabc1: { ...a, values: { name: 'x'.repeat(4000) } } }));
  assert.ok(!isTripStore({ tabc1: { ...a, sources: { name: 'robot' } } }));
  assert.ok(!isTripStore({ tabc1: { ...a, checks: { x: false } } }));
  assert.ok(!isTripStore(null) && !isTripStore([]) && !isTripStore('x'));
  const many: Record<string, unknown> = {};
  for (let i = 0; i < MAX_TRIPS + 1; i++) many[`t${i}abc`] = createTrip('day', `t${i}abc`, NOW);
  assert.ok(!isTripStore(many), 'too many trips');
});

test('importing merges: same id is replaced, other trips are kept, too many is refused', () => {
  const a = createTrip('day', 'tabc1', NOW);
  const b = createTrip('day', 'tdef2', NOW);
  const aEdited = setTripValue(a, 'name', 'Edited', NOW);
  const merged = mergeTripStores({ tabc1: a, tdef2: b }, { tabc1: aEdited });
  assert.ok(merged);
  assert.equal(merged!.tabc1!.values.name, 'Edited');
  assert.ok(merged!.tdef2);
  assert.deepEqual(Object.keys(mergeTripStores(undefined, { tabc1: a })!), ['tabc1']);
  assert.equal(mergeTripStores({}, 'junk'), null);
  const full: Record<string, ReturnType<typeof createTrip>> = {};
  for (let i = 0; i < MAX_TRIPS; i++) full[`t${i}abc`] = createTrip('day', `t${i}abc`, NOW);
  assert.equal(mergeTripStores(full, { tnew99: createTrip('day', 'tnew99', NOW) }), null);
  assert.ok(mergeTripStores(full, { t0abc: full.t0abc! }), 'replacing an existing trip is fine at the limit');
});

test('the limit check flags only values strictly above the award limits', () => {
  const f = (values: Record<string, string>) => Object.fromEntries(limitFindings(values).map((x) => [x.id, x.status]));
  assert.deepEqual(f({}), { landing: 'missing', crossing: 'missing', stream: 'missing', beaufort: 'missing', race: 'none' });
  assert.equal(f({ 'lim.crossing': '2' }).crossing, 'within');
  assert.equal(f({ 'lim.crossing': '2.1' }).crossing, 'over');
  assert.equal(f({ 'lim.crossing': '2,5' }).crossing, 'over', 'a comma decimal is understood');
  assert.equal(f({ 'lim.stream': '2' }).stream, 'within');
  assert.equal(f({ 'lim.stream': '3' }).stream, 'over');
  assert.equal(f({ 'lim.beaufort': '4' }).beaufort, 'within');
  assert.equal(f({ 'lim.beaufort': '5' }).beaufort, 'over');
  assert.equal(f({ 'lim.landing': 'about 3' }).landing, 'invalid');
  assert.equal(f({ 'lim.landing': '-1' }).landing, 'invalid');
  assert.equal(f({ 'lim.race': 'yes' }).race, 'flagged');
  assert.equal(limitsExceeded({ 'lim.crossing': '3', 'lim.race': 'yes', 'lim.stream': '1' }), 2);
});

test('limit findings never call a trip safe or unsafe', () => {
  const text = limitFindings({ 'lim.crossing': '1', 'lim.stream': '9', 'lim.beaufort': '2', 'lim.landing': '1', 'lim.race': 'yes' }).map((x) => x.message).join(' ');
  assert.doesNotMatch(text, /\bsafe\b|\bunsafe\b|\bdangerous\b|\bshould not\b|\bdo not go\b/i);
});

test('the limit check adds gaps only when it is switched on', () => {
  let trip = createTrip('day', 'tabc', NOW);
  const off = tripGaps(trip).length;
  trip = setLimitsOn(trip, true, NOW);
  assert.equal(tripGaps(trip).length, off + 4);
  assert.ok(tripGaps(trip).some((g) => g.scope === 'Limit check'));
});

test('the printed plan marks blanks, formats dates and adds nothing of its own', () => {
  let trip = createTrip('day', 'tabc', NOW);
  trip = setTripValue(trip, 'name', 'Howth loop', NOW);
  trip = setDayValue(trip, 0, 'date', '2026-06-14', NOW);
  const doc = buildPlan(trip);
  assert.equal(doc.title, 'Howth loop');
  assert.match(doc.subtitle, /Day trip/);
  assert.match(doc.subtitle, /Sunday 14 June 2026/);
  const text = planText(doc);
  assert.match(text, /Trip name: Howth loop/);
  assert.match(text, /Launch place: Not filled in/);
  assert.match(text, /STILL TO FILL IN \(\d+\)/);
  assert.ok(doc.gaps.length > 5);
  assert.ok(text.includes(NOT_FILLED));
  assert.doesNotMatch(text, /Recommended|Suggested|We suggest/i);
});

test('a multi-day plan prints each day under its own heading', () => {
  const trip = createTrip('camping', 'tabc', NOW);
  const headings = buildPlan(trip).sections.map((s) => s.heading);
  assert.ok(headings.includes('Day 1: Route') && headings.includes('Day 2: Route') && headings.includes('Day 2: Camp for this night'));
  assert.ok(headings.includes('Camping'));
  assert.ok(!createTrip('day', 'tabc', NOW) || !buildPlan(createTrip('day', 'tabc', NOW)).sections.some((s) => s.heading.startsWith('Day 1')));
});

test('the limit section appears in the printout only when switched on, with its source and a caution', () => {
  const trip = createTrip('day', 'tabc', NOW);
  assert.ok(!buildPlan(trip).sections.some((s) => /limit/i.test(s.heading)));
  const on = buildPlan(setLimitsOn(trip, true, NOW)).sections.find((s) => /limit/i.test(s.heading));
  assert.ok(on);
  assert.match((on!.notes ?? []).join(' '), /BCAB/);
  assert.match((on!.notes ?? []).join(' '), /never says a trip is safe or unsafe/);
});

test('the final checklist uses sourced leader checklist items and ticks are stored per trip', () => {
  assert.ok(finalChecklistItems.length >= 10);
  assert.ok(finalChecklistItems.every((i) => i.source));
  let trip = createTrip('day', 'tabc', NOW);
  trip = setCheck(trip, finalChecklistItems[0]!.id, true, NOW);
  assert.equal(buildPlan(trip).sections.find((s) => s.heading === 'Final planning checklist')!.rows[0]!.value, `1 of ${finalChecklistItems.length}`);
  trip = setCheck(trip, finalChecklistItems[0]!.id, false, NOW);
  assert.deepEqual(trip.checks, {});
  assert.ok(isTrip(trip));
});

test('titles fall back to a name for an untitled plan', () => {
  assert.equal(tripTitle(createTrip('camping', 'tabc', NOW)), 'Untitled multi-day, camping');
  assert.equal(tripTitle(setTripValue(createTrip('day', 'tabc', NOW), 'name', ' Dalkey ', NOW)), 'Dalkey');
});

test('dates format without shifting a day for any time zone', () => {
  assert.equal(formatDate('2026-01-01'), 'Thursday 1 January 2026');
  assert.equal(formatDate('not a date'), 'not a date');
  assert.equal(formatDate('2026-02-30'), formatDate('2026-02-30'));
});

test('the PDF keeps line breaks the user typed', async () => {
  const { planPdfBlocks } = await import('./output');
  let trip = setTripValue(createTrip('day', 'tabc', NOW), 'participants', 'Ann\nBen\r\nCara', NOW);
  trip = setTripValue(trip, 'name', 'X', NOW);
  const blocks = planPdfBlocks(buildPlan(trip));
  const paras = blocks.flatMap((b) => (b.kind === 'para' ? [b.runs.map((r) => r.text).join('')] : []));
  const i = paras.findIndex((p) => p.startsWith('Participants: '));
  assert.deepEqual(paras.slice(i, i + 3), ['Participants: Ann', 'Ben', 'Cara']);
});
