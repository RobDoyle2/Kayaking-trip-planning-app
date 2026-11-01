import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clockTime, readSaved, removeSaved, writeSaved, writeFailureMessage, type KeyValueStore } from './storage';
import { isBooleanRecord } from './guards';

function fakeStore(initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial };
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

test('nothing saved reads as empty', () => {
  assert.deepEqual(readSaved(fakeStore(), 'k', 1, isBooleanRecord), { status: 'empty' });
});

test('a saved value reads back with its save time', () => {
  const store = fakeStore();
  const w = writeSaved(store, 'k', 1, { a: true }, () => new Date('2026-11-01T14:32:00Z'));
  assert.deepEqual(w, { ok: true, savedAt: '2026-11-01T14:32:00.000Z' });
  const r = readSaved(store, 'k', 1, isBooleanRecord);
  assert.equal(r.status, 'ok');
  if (r.status === 'ok') assert.deepEqual(r.saved.data, { a: true });
});

test('corrupt JSON, wrong shape and wrong data all read as corrupt, never as a crash', () => {
  for (const raw of ['{not json', '"text"', '{"v":1}', '{"v":1,"savedAt":"x","data":{"a":"yes"}}', 'null', '[]']) {
    assert.equal(readSaved(fakeStore({ k: raw }), 'k', 1, isBooleanRecord).status, 'corrupt', raw);
  }
});

test('data from a newer version of the app is left alone', () => {
  const raw = JSON.stringify({ v: 2, savedAt: 'x', data: { a: true } });
  assert.equal(readSaved(fakeStore({ k: raw }), 'k', 1, isBooleanRecord).status, 'newer');
});

test('blocked storage is reported, not thrown', () => {
  assert.equal(readSaved(null, 'k', 1, isBooleanRecord).status, 'unavailable');
  assert.deepEqual(writeSaved(null, 'k', 1, {}), { ok: false, reason: 'unavailable' });
  assert.equal(removeSaved(null, 'k'), false);
});

test('a full or failing store is reported with the right reason', () => {
  const full: KeyValueStore = {
    getItem: () => null,
    setItem: () => {
      const e = new Error('full');
      e.name = 'QuotaExceededError';
      throw e;
    },
    removeItem: () => {},
  };
  assert.deepEqual(writeSaved(full, 'k', 1, {}), { ok: false, reason: 'full' });
  const broken: KeyValueStore = { ...full, setItem: () => { throw new Error('boom'); } };
  assert.deepEqual(writeSaved(broken, 'k', 1, {}), { ok: false, reason: 'error' });
});

test('failure messages tell the user what to do and never claim the work was saved', () => {
  for (const reason of ['unavailable', 'full', 'error'] as const) {
    const m = writeFailureMessage(reason);
    assert.match(m, /Download|clear/i);
    assert.doesNotMatch(m, /was saved|has been saved/i);
  }
});

test('clock time is short and tolerates bad input', () => {
  assert.match(clockTime('2026-11-01T14:32:00Z'), /\d{2}:\d{2}/);
  assert.equal(clockTime('not a date'), '');
});
