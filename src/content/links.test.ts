import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isLinkList,
  isSafeWebUrl,
  linkCategories,
  linkLabel,
  linksIn,
  MAX_DESCRIPTION_LENGTH,
  MAX_LINKS,
  MAX_URL_LENGTH,
  mergeLinkLists,
  newLinkId,
  normaliseUrl,
  siteName,
  type LinkEntry,
} from './links';
import { applyImport, exportAll, parseImport, savedItemDefs, storageKey } from '../lib/savedItems';
import { readSaved, writeSaved, type KeyValueStore } from '../lib/storage';

function link(id: string, over: Partial<LinkEntry> = {}): LinkEntry {
  return { id, url: 'https://www.canoe.ie/', description: 'Canoeing Ireland', category: 'training', addedAt: '2026-11-22T10:00:00.000Z', ...over };
}

function fakeStore(): KeyValueStore {
  const data: Record<string, string> = {};
  return {
    getItem: (k) => (k in data ? data[k]! : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

test('the four categories are the ones the brief names, in order', () => {
  assert.deepEqual(
    linkCategories.map((c) => c.label),
    ['Trip Planning', 'Leadership', 'Training and Skills', 'Other'],
  );
});

test('an address without a scheme gets https', () => {
  assert.deepEqual(normaliseUrl('www.canoe.ie'), { ok: true, url: 'https://www.canoe.ie/' });
  assert.deepEqual(normaliseUrl('  ecskc.eu/basic-safety  '), { ok: true, url: 'https://ecskc.eu/basic-safety' });
  assert.deepEqual(normaliseUrl('//ecskc.eu'), { ok: true, url: 'https://ecskc.eu/' });
});

test('http and https addresses are kept, with capital letters in the scheme tolerated', () => {
  assert.deepEqual(normaliseUrl('http://example.org/a?b=1#c'), { ok: true, url: 'http://example.org/a?b=1#c' });
  assert.equal(normaliseUrl('HTTPS://EXAMPLE.ORG').ok, true);
});

test('addresses that could run code or open local files are refused', () => {
  for (const bad of [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'blob:https://example.org/x',
    'mailto:a@b.ie',
    'tel:999',
    'ftp://example.org/file',
    'about:blank',
    'chrome://settings',
  ]) {
    const result = normaliseUrl(bad);
    assert.equal(result.ok, false, `should refuse ${JSON.stringify(bad)}`);
  }
});

test('other bad input is refused with a reason a member can act on', () => {
  for (const bad of ['', '   ', 'not a web address', 'hello', 'http://', 'https://.', 'https://example', 'https://user:pass@example.org/', 'https://example.org/a b']) {
    const result = normaliseUrl(bad);
    assert.equal(result.ok, false, `should refuse ${JSON.stringify(bad)}`);
    if (!result.ok) assert.ok(result.message.length > 10);
  }
  assert.equal(normaliseUrl(`https://example.org/${'a'.repeat(MAX_URL_LENGTH)}`).ok, false);
});

test('isSafeWebUrl is strict about what it accepts', () => {
  assert.equal(isSafeWebUrl('https://www.canoe.ie/'), true);
  assert.equal(isSafeWebUrl('javascript:alert(1)'), false);
  assert.equal(isSafeWebUrl('https://localhost/'), false);
  assert.equal(isSafeWebUrl('https://user@example.org/'), false);
  assert.equal(isSafeWebUrl('www.canoe.ie'), false);
  assert.equal(isSafeWebUrl(''), false);
});

test('the link text is the member’s note, or the site name when there is no note', () => {
  assert.equal(linkLabel(link('labc', { description: '  Award pages ' })), 'Award pages');
  assert.equal(linkLabel(link('labc', { description: '   ' })), 'canoe.ie');
  assert.equal(siteName('https://www.marine.ie/x/y'), 'marine.ie');
});

test('new ids are accepted by the validator', () => {
  const id = newLinkId();
  assert.match(id, /^l[a-z0-9]{3,24}$/);
  assert.equal(isLinkList([link(id)]), true);
});

test('a saved list is checked completely', () => {
  assert.equal(isLinkList([]), true);
  assert.equal(isLinkList([link('l1abc')]), true);
  assert.equal(isLinkList({}), false);
  assert.equal(isLinkList([link('l1abc'), link('l1abc')]), false, 'duplicate ids');
  assert.equal(isLinkList([link('l1abc', { url: 'javascript:alert(1)' })]), false);
  assert.equal(isLinkList([link('l1abc', { category: 'sea' as never })]), false);
  assert.equal(isLinkList([link('l1abc', { description: 'x'.repeat(MAX_DESCRIPTION_LENGTH + 1) })]), false);
  assert.equal(isLinkList([link('BAD ID')]), false);
  assert.equal(isLinkList([{ id: 'l1abc', url: 'https://a.ie' }]), false);
  assert.equal(isLinkList(Array.from({ length: MAX_LINKS + 1 }, (_, i) => link(`l${i}abc`))), false);
  assert.equal(isLinkList(Array.from({ length: MAX_LINKS }, (_, i) => link(`l${i}abc`))), true);
});

test('links for a category come back in the order they were added, and only that category', () => {
  const list = [
    link('l3abc', { category: 'leadership', addedAt: '2026-11-22T12:00:00.000Z' }),
    link('l1abc', { category: 'leadership', addedAt: '2026-11-22T10:00:00.000Z' }),
    link('l2abc', { category: 'other' }),
  ];
  assert.deepEqual(linksIn(list, 'leadership').map((l) => l.id), ['l1abc', 'l3abc']);
  assert.deepEqual(linksIn(list, 'other').map((l) => l.id), ['l2abc']);
  assert.deepEqual(linksIn(list, 'trip-planning'), []);
});

test('importing merges by id: the file wins for the same id and other links are kept', () => {
  const existing = [link('l1abc', { description: 'old' }), link('l2abc')];
  const incoming = [link('l1abc', { description: 'new' }), link('l3abc')];
  const merged = mergeLinkLists(existing, incoming);
  assert.ok(merged);
  assert.equal(merged.length, 3);
  assert.equal(merged.find((l) => l.id === 'l1abc')?.description, 'new');
  assert.equal(mergeLinkLists(undefined, incoming)?.length, 2);
});

test('an import that would pass the limit is refused, and so is a bad list', () => {
  const full = Array.from({ length: MAX_LINKS }, (_, i) => link(`l${i}abc`));
  assert.equal(mergeLinkLists(full, [link('lnewabc')]), null);
  assert.equal(mergeLinkLists([], 'nope'), null);
});

test('My links is in the saved-items list, so it can be exported, imported and deleted from My plans', () => {
  const def = savedItemDefs.find((d) => d.id === 'links');
  assert.ok(def);
  assert.equal(def.href, '/trip-planning/links');
  assert.ok(def.merge);
});

test('links survive an export and an import on another device', () => {
  const a = fakeStore();
  const mine = [link('l1abc'), link('l2abc', { url: 'https://ecskc.eu/', category: 'other', description: '' })];
  assert.equal(writeSaved(a, storageKey('ecskc', 'links'), 1, mine).ok, true);
  const { json, count } = exportAll(a, 'ecskc');
  assert.equal(count, 1);

  const parsed = parseImport(json, 'ecskc');
  assert.ok(parsed.ok);
  const b = fakeStore();
  const done = applyImport(b, 'ecskc', parsed.items);
  assert.deepEqual(done, { written: 1, failed: 0 });
  const back = readSaved(b, storageKey('ecskc', 'links'), 1, isLinkList);
  assert.equal(back.status, 'ok');
  if (back.status === 'ok') assert.deepEqual(back.saved.data, mine);
});

test('an import file with a dangerous link in it is refused whole', () => {
  const file = {
    app: 'sea-kayaking-hub',
    club: 'ecskc',
    exportedAt: '2026-11-22T10:00:00.000Z',
    items: { links: { v: 1, savedAt: '2026-11-22T10:00:00.000Z', data: [link('l1abc', { url: 'javascript:alert(1)' })] } },
  };
  const parsed = parseImport(JSON.stringify(file), 'ecskc');
  assert.equal(parsed.ok, false);
});
