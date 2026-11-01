import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sections, sectionsForClub, statusLabel, findSection } from './sections';
import { getClub } from '../clubs';

test('there are exactly six sections, in the approved order', () => {
  assert.deepEqual(
    sections.map((s) => s.id),
    ['leadership', 'trip-planning', 'training', 'navigation', 'vhf', 'knowledge'],
  );
});

test('section ids and paths are unique and paths start with a slash', () => {
  assert.equal(new Set(sections.map((s) => s.id)).size, sections.length);
  assert.equal(new Set(sections.map((s) => s.path)).size, sections.length);
  for (const s of sections) assert.match(s.path, /^\/[a-z-]+$/);
});

test('item ids are unique within a section', () => {
  for (const s of sections) {
    assert.equal(new Set(s.items.map((i) => i.id)).size, s.items.length, s.id);
  }
});

test('every unfinished item says honestly why or when', () => {
  for (const s of sections) {
    for (const item of s.items) {
      if (item.status === 'blocked') assert.ok(item.blockedBy, `${s.id}/${item.id} is blocked without a reason`);
      if (item.status === 'planned') {
        assert.ok(item.stage && item.stage >= 1 && item.stage <= 6, `${s.id}/${item.id} has no stage`);
      }
      if (item.status === 'ready' || item.status === 'preview') {
        assert.ok(item.href, `${s.id}/${item.id} claims to exist but has no route`);
      }
    }
  }
});

test('the SHEETS item is a preview, names its source, and does not expand the acronym', () => {
  const sheets = sections.find((s) => s.id === 'leadership')?.items.find((i) => i.id === 'sheets');
  assert.equal(sheets?.status, 'preview');
  assert.equal(sheets?.href, '/leadership/sheets');
  assert.match(sheets?.note ?? '', /not confirmed/);
  assert.doesNotMatch(JSON.stringify(sheets), /Safety|Hazard|Equipment|Emergency/, 'must not guess an expansion');
});

test('status labels are readable', () => {
  assert.equal(statusLabel({ status: 'ready' }), 'Available');
  assert.equal(statusLabel({ status: 'planned', stage: 3 }), 'Planned: Stage 3');
  assert.equal(statusLabel({ status: 'blocked' }), 'Blocked');
  assert.equal(statusLabel({ status: 'preview' }), 'Preview');
});

test('the ECSKC club enables all six sections and its logo path is a club asset', () => {
  const club = getClub('ecskc');
  assert.equal(sectionsForClub(club.enabledSections).length, 6);
  assert.match(club.logo.src, /^\/clubs\/ecskc\//);
  assert.match(club.website.url, /^https:\/\/ecskc\.eu\//);
});

test('an unknown club fails loudly', () => {
  assert.throws(() => getClub('nope'), /Unknown club/);
});

test('findSection looks a section up by path', () => {
  assert.equal(findSection('/vhf')?.id, 'vhf');
  assert.equal(findSection('/missing'), undefined);
});

test('every built item in the registry has its address in the list of tool pages', async () => {
  const { toolPaths, fixedPaths } = await import('../routePaths');
  const known = new Set([...Object.keys(toolPaths), ...fixedPaths]);
  for (const section of sections) {
    for (const item of section.items) {
      if (item.href) assert.ok(known.has(item.href), `${section.id}/${item.id} points to ${item.href}, which has no page`);
    }
  }
  for (const [path, sectionId] of Object.entries(toolPaths)) {
    const section = sections.find((s) => s.id === sectionId);
    assert.ok(section && path.startsWith(`${section.path}/`), `${path} is not under its section ${sectionId}`);
  }
});
