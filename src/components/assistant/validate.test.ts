import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkQuestion, MAX_QUESTION_LENGTH } from './validate';

test('empty and blank questions are rejected with a helpful message', () => {
  for (const input of ['', '   ', '\n\t ']) {
    const result = checkQuestion(input);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.message, /Type a question/);
  }
});

test('a normal question passes and is trimmed', () => {
  const result = checkQuestion('  What should I consider before leading a trip?  ');
  assert.deepEqual(result, { ok: true, text: 'What should I consider before leading a trip?' });
});

test('control characters are removed and spaces collapsed', () => {
  const result = checkQuestion('tide\u0000   times\u0007 today');
  assert.deepEqual(result, { ok: true, text: 'tide times today' });
});

test('over-long questions are rejected and say how long they are', () => {
  const result = checkQuestion('a'.repeat(MAX_QUESTION_LENGTH + 1));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.message, new RegExp(String(MAX_QUESTION_LENGTH + 1)));
});

test('a question of exactly the maximum length is accepted', () => {
  assert.equal(checkQuestion('a'.repeat(MAX_QUESTION_LENGTH)).ok, true);
});
