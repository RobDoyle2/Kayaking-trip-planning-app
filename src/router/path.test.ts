import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalisePath } from './path';

test('the home page in all its spellings', () => {
  for (const input of ['/', '', '//', '/index.html', '/INDEX.HTML']) {
    assert.equal(normalisePath(input), '/', input);
  }
});

test('trailing and repeated slashes are removed', () => {
  assert.equal(normalisePath('/leadership/'), '/leadership');
  assert.equal(normalisePath('//leadership'), '/leadership');
  assert.equal(normalisePath('/trip-planning///'), '/trip-planning');
});

test('capital letters do not matter', () => {
  assert.equal(normalisePath('/Leadership'), '/leadership');
  assert.equal(normalisePath('/VHF'), '/vhf');
});

test('an unknown path stays unknown (so the not-found page shows)', () => {
  assert.equal(normalisePath('/leadership/extra'), '/leadership/extra');
});
