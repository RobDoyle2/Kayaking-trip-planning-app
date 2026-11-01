import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  briefingText,
  buildBriefing,
  missingFields,
  sectionProgress,
  sheetsMeta,
  sheetsSections,
  sheetsSource,
  unconfirmedChecks,
} from './sheets';

test('the headings are exactly the six the source page gives, in order', () => {
  assert.deepEqual(
    sheetsSections.map((s) => `${s.letter}: ${s.heading}`),
    ['S: Safety and Signals', 'H: Humans', 'E: Equipment', 'E: Environment', 'T: Timings', 'S: Safety and signals (Q&A)'],
  );
});

test('the app never spells out the acronym (the source does not)', () => {
  const everything = JSON.stringify({ sheetsSections, sheetsMeta, text: briefingText({}) });
  // These are the plausible but unsupported expansions; none may appear as an expansion of the letters.
  assert.doesNotMatch(everything, /SHEETS (stands|means) for/i);
  assert.doesNotMatch(everything, /S\s*=\s*Safety|H\s*=\s*Hazard|E\s*=\s*Emergenc/i);
});

test('field ids are unique across the whole briefing', () => {
  const ids = [...sheetsMeta, ...sheetsSections.flatMap((s) => s.fields)].map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('the source is credited and its lack of a licence is stated', () => {
  assert.match(sheetsSource.url, /^https:\/\/saturnbull\.co\.uk\/sheets\/$/);
  assert.match(sheetsSource.notice, /saturnbull/);
  assert.match(sheetsSource.notice, /No author, date or reuse licence/);
});

test('an empty briefing lists every required field as missing and nothing is invented', () => {
  const missing = missingFields({});
  assert.ok(missing.length >= 10);
  const t = briefingText({});
  assert.match(t, /Still to fill in \(\d+\)/);
  assert.match(t, /Not filled in/);
  assert.doesNotMatch(t, /All required fields/);
});

test('filling a required field removes it from the missing list and shows its text', () => {
  const values = { numberTwo: '  Aoife  ', groupControl: 'Close, with a sweep' };
  const missing = missingFields(values).map((f) => f.id);
  assert.ok(!missing.includes('numberTwo'));
  assert.ok(!missing.includes('groupControl'));
  assert.match(briefingText(values), /Number two \(name\): Aoife/);
});

test('whitespace-only entries count as blank', () => {
  assert.ok(missingFields({ leader: '   \n  ' }).some((f) => f.id === 'leader'));
});

test('checkboxes: unticked are reported as not confirmed, ticked as yes', () => {
  const values = { inSight: true };
  const text = briefingText(values);
  assert.match(text, /Everyone knows to keep each other in sight: Yes/);
  assert.match(text, /Signal taught: stop: Not confirmed/);
  assert.ok(!unconfirmedChecks(values).some((f) => f.id === 'inSight'));
  assert.ok(unconfirmedChecks(values).some((f) => f.id === 'sigStop'));
});

test('a complete briefing says so', () => {
  const values: Record<string, string | boolean> = {};
  for (const f of [...sheetsMeta, ...sheetsSections.flatMap((s) => s.fields)]) {
    values[f.id] = f.kind === 'check' ? true : 'x';
  }
  assert.equal(missingFields(values).length, 0);
  assert.match(briefingText(values), /All required fields are filled in\./);
});

test('timings shows the distance entered under Environment, once, as the single source', () => {
  const b = buildBriefing({ distance: '8 nautical miles' });
  const timings = b.sections.find((s) => s.heading === 'Timings');
  assert.ok(timings?.lines.some((l) => l.label === 'Distance to be covered' && l.value === '8 nautical miles'));
});

test('section progress counts filled text and ticked checks', () => {
  const s = sheetsSections.find((x) => x.id === 'safety-signals')!;
  assert.deepEqual(sectionProgress(s, {}), { done: 0, total: s.fields.length });
  assert.equal(sectionProgress(s, { numberTwo: 'Aoife', sigStop: true, sigLeft: false }).done, 2);
});

test('the briefing text credits the framework source', () => {
  assert.match(briefingText({}), /saturnbull\.co\.uk\/sheets/);
});
