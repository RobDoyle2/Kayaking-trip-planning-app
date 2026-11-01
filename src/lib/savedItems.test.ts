import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyImport, deleteAllSaved, exportAll, listSaved, MAX_IMPORT_BYTES, parseImport, savedItemDefs, storageKey } from './savedItems';
import { writeSaved, type KeyValueStore } from './storage';

function fakeStore(): KeyValueStore & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

test('every saved item has a unique id and a page to open', () => {
  assert.equal(new Set(savedItemDefs.map((d) => d.id)).size, savedItemDefs.length);
  for (const d of savedItemDefs) assert.match(d.href, /^\/(leadership|trip-planning|training)\//);
});

test('keys are namespaced by club so clubs never overwrite each other', () => {
  assert.equal(storageKey('ecskc', 'sheets-briefing'), 'skh:ecskc:sheets-briefing');
  assert.notEqual(storageKey('ecskc', 'x'), storageKey('other', 'x'));
});

test('listing shows empty, saved and unreadable items honestly', () => {
  const store = fakeStore();
  writeSaved(store, storageKey('ecskc', 'leader-checklist'), 1, { 'plan-3': true });
  store.data[storageKey('ecskc', 'sheets-briefing')] = '{broken';
  const list = listSaved(store, 'ecskc');
  assert.equal(list.find((i) => i.id === 'leader-checklist')?.status, 'saved');
  assert.equal(list.find((i) => i.id === 'sheets-briefing')?.status, 'unreadable');
  assert.equal(list.find((i) => i.id === 'risk-assessment')?.status, 'empty');
  assert.ok(listSaved(null, 'ecskc').every((i) => i.status === 'unavailable'));
});

test('export then import restores exactly what was saved', () => {
  const a = fakeStore();
  writeSaved(a, storageKey('ecskc', 'leader-checklist'), 1, { 'plan-3': true });
  writeSaved(a, storageKey('ecskc', 'sheets-briefing'), 1, { tripName: 'Howth', inSight: true });
  const { json, count } = exportAll(a, 'ecskc');
  assert.equal(count, 2);
  const parsed = parseImport(json, 'ecskc');
  assert.equal(parsed.ok, true);
  const b = fakeStore();
  if (parsed.ok) assert.deepEqual(applyImport(b, 'ecskc', parsed.items), { written: 2, failed: 0 });
  assert.equal(JSON.parse(b.data[storageKey('ecskc', 'sheets-briefing')]).data.tripName, 'Howth');
});

test('imports are refused for the wrong app, wrong club, damage, unknown items, junk and oversize files', () => {
  const good = { app: 'sea-kayaking-hub', club: 'ecskc', exportedAt: 'x', items: { 'leader-checklist': { v: 1, savedAt: 'x', data: { a: true } } } };
  assert.equal(parseImport(JSON.stringify(good), 'ecskc').ok, true);
  const cases: [string, string][] = [
    ['not json', '{oops'],
    ['an array', '[]'],
    ['a number', '5'],
    ['another app', JSON.stringify({ ...good, app: 'other' })],
    ['another club', JSON.stringify({ ...good, club: 'other' })],
    ['no items', JSON.stringify({ ...good, items: {} })],
    ['items as array', JSON.stringify({ ...good, items: [] })],
    ['unknown item', JSON.stringify({ ...good, items: { evil: { v: 1, savedAt: 'x', data: {} } } })],
    ['prototype key', '{"app":"sea-kayaking-hub","club":"ecskc","items":{"__proto__":{"v":1,"savedAt":"x","data":{}}}}'],
    ['bad data shape', JSON.stringify({ ...good, items: { 'leader-checklist': { v: 1, savedAt: 'x', data: { a: 'yes' } } } })],
    ['newer version', JSON.stringify({ ...good, items: { 'leader-checklist': { v: 9, savedAt: 'x', data: { a: true } } } })],
    ['oversize', ' '.repeat(MAX_IMPORT_BYTES + 1)],
  ];
  for (const [name, text] of cases) assert.equal(parseImport(text, 'ecskc').ok, false, name);
});

test('one bad item rejects the whole file, so nothing is half-imported', () => {
  const file = {
    app: 'sea-kayaking-hub', club: 'ecskc', exportedAt: 'x',
    items: { 'leader-checklist': { v: 1, savedAt: 'x', data: { a: true } }, 'risk-assessment': { v: 1, savedAt: 'x', data: { header: 5, rows: [] } } },
  };
  assert.equal(parseImport(JSON.stringify(file), 'ecskc').ok, false);
});

test('delete all removes only this club’s items', () => {
  const s = fakeStore();
  writeSaved(s, storageKey('ecskc', 'leader-checklist'), 1, {});
  writeSaved(s, storageKey('other', 'leader-checklist'), 1, {});
  s.data['unrelated'] = 'keep';
  deleteAllSaved(s, 'ecskc');
  assert.ok(!(storageKey('ecskc', 'leader-checklist') in s.data));
  assert.ok(storageKey('other', 'leader-checklist') in s.data);
  assert.equal(s.data['unrelated'], 'keep');
});
