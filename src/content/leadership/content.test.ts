import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allItems, checklistProgress, checklistText, equipmentChecklist, leaderChecklist } from './checklists';
import { groupGuide, preparingGuide, responsibilitiesGuide } from './guides';
import { leadershipSources } from './sources';
import { addRow, hazardPrompts, isRiskAssessment, MAX_RISK_ROWS, newRow, removeRow, riskGaps, riskText, updateRow } from './risk';
import { isReview, ratingAreas, reviewText } from './review';

test('every checklist item names a real source, and ids are unique', () => {
  for (const def of [leaderChecklist, equipmentChecklist]) {
    const items = allItems(def);
    assert.equal(new Set(items.map((i) => i.id)).size, items.length, def.id);
    for (const i of items) assert.ok(leadershipSources[i.source], `${i.id} cites unknown source ${i.source}`);
  }
  const all = [...allItems(leaderChecklist), ...allItems(equipmentChecklist)].map((i) => i.id);
  assert.equal(new Set(all).size, all.length, 'ids must be unique across both checklists because they share nothing but must not clash');
});

test('every guide section and hazard prompt names real sources', () => {
  for (const g of [preparingGuide, responsibilitiesGuide, groupGuide]) {
    for (const s of g.sections) {
      assert.ok(s.sources.length > 0, `${g.id}/${s.heading} has no source`);
      for (const k of s.sources) assert.ok(leadershipSources[k], `${g.id} cites unknown source ${k}`);
    }
  }
  for (const h of hazardPrompts) assert.ok(leadershipSources[h.source], `${h.id}`);
  assert.equal(new Set(hazardPrompts.map((h) => h.id)).size, hazardPrompts.length);
});

test('award limits quoted in the guide match the verified figures', () => {
  const text = JSON.stringify(preparingGuide);
  assert.match(text, /2 nautical miles apart/);
  assert.match(text, /up to 2 knots/);
  assert.match(text, /Beaufort force 4/);
  assert.match(text, /1 metre/);
  assert.match(text, /3 to 6/);
});

test('guides say the limits are information, not club rules', () => {
  assert.match(JSON.stringify(preparingGuide), /not ECSKC rules/);
});

test('progress counts only true ticks', () => {
  const n = allItems(leaderChecklist).length;
  assert.deepEqual(checklistProgress(leaderChecklist, {}), { done: 0, total: n });
  assert.equal(checklistProgress(leaderChecklist, { 'plan-3': true, 'plan-award': false, 'not-an-item': true }).done, 1);
});

test('risk rows: add, update, remove, no duplicates from prompts, and a cap', () => {
  let rows = addRow([], newRow('r1', 'Wind against tide'));
  rows = addRow(rows, newRow('r2', 'Wind against tide'));
  assert.equal(rows.length, 1, 'the same prompt is not added twice');
  rows = updateRow(rows, 'r1', { controls: 'Avoid the headland at peak stream' });
  assert.equal(rows[0].controls, 'Avoid the headland at peak stream');
  assert.equal(removeRow(rows, 'r1').length, 0);
  let many = [] as ReturnType<typeof addRow>;
  for (let i = 0; i < MAX_RISK_ROWS + 5; i++) many = addRow(many, newRow(`r${i}`));
  assert.equal(many.length, MAX_RISK_ROWS);
});

test('risk gaps flag blanks and the text says it is not the ECSKC template', () => {
  const a = { header: {}, rows: [newRow('r1', 'Fog')] };
  const gaps = riskGaps(a);
  assert.ok(gaps.some((g) => /Activity or trip is blank/.test(g)));
  assert.ok(gaps.some((g) => /"Fog" has no controls/.test(g)));
  assert.match(riskText(a), /not the ECSKC template/);
  assert.deepEqual(riskGaps({ header: { activity: 'a', location: 'b', date: 'c', assessor: 'd' }, rows: [{ ...newRow('r1', 'Fog'), controls: 'Check forecast' }] }), []);
});

test('saved risk data is validated before use', () => {
  assert.equal(isRiskAssessment({ header: {}, rows: [] }), true);
  assert.equal(isRiskAssessment({ header: { a: 1 }, rows: [] }), false);
  assert.equal(isRiskAssessment({ header: {}, rows: [{ id: 1 }] }), false);
  assert.equal(isRiskAssessment({ header: {}, rows: new Array(MAX_RISK_ROWS + 1).fill(newRow('x')) }), false);
  assert.equal(isRiskAssessment(null), false);
});

test('review: ratings are limited to the checklist’s three words and the text lists only rated areas', () => {
  assert.equal(isReview({ values: {}, ratings: { 'a-vision': 'Strong' } }), true);
  assert.equal(isReview({ values: {}, ratings: { 'a-vision': 'Excellent' } }), false);
  const t = reviewText({ values: { tripName: 'Howth' }, ratings: { 'c-tow': 'Develop' } });
  assert.match(t, /Trip name: Howth/);
  assert.match(t, /C\. Towing a casualty: Develop/);
  assert.doesNotMatch(t, /A\. Judgement/);
  assert.equal(ratingAreas.length, 4);
});

test('checklist text marks ticked and unticked items and counts them', () => {
  const t = checklistText(leaderChecklist, { 'plan-3': true });
  assert.match(t, /\[x\] The group is at least three paddlers\./);
  assert.match(t, /\[ \] Every paddler has trained/);
  assert.match(t, new RegExp(`1 of ${allItems(leaderChecklist).length} ticked\\.`));
});
