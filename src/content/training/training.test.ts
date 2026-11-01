import assert from 'node:assert/strict';
import test from 'node:test';
import { leadershipSources } from '../leadership/sources';
import { developmentChecklists } from './checklists';
import { trainingGuide } from './guidance';
import {
  MAX_ACTIONS,
  addAction,
  emptyPlan,
  isDevelopmentPlan,
  newAction,
  noteBoxes,
  planAreas,
  planText,
  removeAction,
  setNote,
  setRating,
  summarise,
  totalItems,
  updateAction,
} from './plan';
import { awardLevels } from './qualifications';

test('the plan rates the same lines as the leader checklist (25 lines in four areas)', () => {
  assert.equal(totalItems, 25);
  assert.deepEqual(noteBoxes.map((b) => b.id), ['leadership', 'paddling', 'rescue', 'background', 'experience', 'reflective']);
});

test('ratings only accept Strong, Competent or Develop, and blank clears a rating', () => {
  let plan = setRating(emptyPlan, 'a-judgement', 'Strong');
  assert.equal(plan.ratings['a-judgement'], 'Strong');
  assert.equal(setRating(plan, 'a-judgement', 'Excellent').ratings['a-judgement'], 'Strong', 'an invented rating changes nothing');
  plan = setRating(plan, 'a-judgement', '');
  assert.deepEqual(plan.ratings, {});
});

test('the summary counts each rating and lists the lines rated Develop with their area', () => {
  const [a1, a2, c1] = [planAreas[0]!.items[0]!, planAreas[0]!.items[1]!, planAreas[2]!.items[0]!];
  let plan = setRating(emptyPlan, a1.id, 'Strong');
  plan = setRating(plan, a2.id, 'Develop');
  plan = setRating(plan, c1.id, 'Develop');
  const s = summarise(plan);
  assert.deepEqual([s.rated, s.strong, s.competent, s.develop, s.total], [3, 1, 0, 2, 25]);
  assert.deepEqual(s.developItems, [{ area: 'A', label: a2.label }, { area: 'C', label: c1.label }]);
});

test('actions can be added, edited and removed, up to a limit, and long text is clipped', () => {
  let actions = emptyPlan.actions;
  for (let i = 0; i < MAX_ACTIONS + 10; i++) actions = addAction(actions, newAction(`a${i}`));
  assert.equal(actions.length, MAX_ACTIONS);
  actions = updateAction(actions, 'a1', { text: 'x'.repeat(2000), when: 'y'.repeat(2000), done: true, area: 'rescue' });
  assert.equal(actions[1]!.text.length, 500);
  assert.equal(actions[1]!.when.length, 200);
  assert.ok(actions[1]!.done);
  assert.equal(removeAction(actions, 'a1').length, MAX_ACTIONS - 1);
});

test('validation accepts a good plan and refuses damaged ones', () => {
  assert.ok(isDevelopmentPlan(emptyPlan));
  const good = { ratings: { 'a-judgement': 'Develop' }, notes: { rescue: 'Practise towing' }, actions: [{ id: 'a1', text: 't', area: 'rescue', when: '', done: false }] };
  assert.ok(isDevelopmentPlan(good));
  assert.ok(!isDevelopmentPlan({ ...good, ratings: { x: 'Great' } }));
  assert.ok(!isDevelopmentPlan({ ...good, notes: { x: 5 } }));
  assert.ok(!isDevelopmentPlan({ ...good, notes: { x: 'z'.repeat(4000) } }));
  assert.ok(!isDevelopmentPlan({ ...good, actions: [{ id: 'a1', text: 't', area: '', when: '', done: 'yes' }] }));
  assert.ok(!isDevelopmentPlan({ ...good, actions: Array.from({ length: MAX_ACTIONS + 1 }, (_, i) => ({ id: `a${i}`, text: '', area: '', when: '', done: false })) }));
  assert.ok(!isDevelopmentPlan(null) && !isDevelopmentPlan([]) && !isDevelopmentPlan('x'));
});

test('the plan text marks blanks, lists what to develop and says it is not an assessment', () => {
  let plan = setNote(emptyPlan, 'rescue', 'Practise towing');
  plan = setRating(plan, planAreas[2]!.items[0]!.id, 'Develop');
  plan = { ...plan, actions: addAction(plan.actions, { id: 'a1', text: 'Book a rescue session', area: 'rescue', when: 'before May', done: false }) };
  const text = planText(plan);
  assert.match(text, /does not assess you/);
  assert.match(text, /Rated: 1 of 25\. Strong: 0\. Competent: 0\. Develop: 1\./);
  assert.match(text, /- C\. Deep-water rescue/);
  assert.match(text, /Rescues and incident management: Practise towing/);
  assert.match(text, /Participant-focused leadership: Not filled in/);
  assert.match(text, /- \[ \] Book a rescue session \(Rescues and incident management; by when: before May\)/);
  assert.match(text, /Not rated/);
});

test('every personal checklist line names a real source, and ids are unique', () => {
  const seen = new Set<string>();
  for (const c of developmentChecklists) {
    for (const g of c.def.groups) {
      for (const item of g.items) {
        assert.ok(leadershipSources[item.source], `${item.id} names an unknown source "${item.source}"`);
        assert.ok(item.text.trim().length >= 5);
        assert.ok(!seen.has(item.id), `duplicate id ${item.id}`);
        seen.add(item.id);
      }
    }
  }
  assert.equal(new Set(developmentChecklists.map((c) => c.def.id)).size, developmentChecklists.length);
  assert.equal(new Set(developmentChecklists.map((c) => c.path)).size, developmentChecklists.length);
});

test('the personal checklists say a tick is not an assessment', () => {
  for (const c of developmentChecklists) assert.match(c.def.intro, /does not mean you are qualified, assessed or ready to lead/);
});

test('the awards pathway lists levels 1 to 5 with canoe.ie links', () => {
  assert.deepEqual(awardLevels.map((l) => l.level), [1, 2, 3, 4, 5]);
  assert.deepEqual(awardLevels.map((l) => l.name), ['Discovery', 'Peer', 'Explorer', 'Adventure', 'Horizon']);
  for (const l of awardLevels) assert.match(l.url, /^https:\/\/www\.canoe\.ie\//);
});

test('the training guidance cites real sources, and makes no comparison the sources do not support', () => {
  for (const s of trainingGuide.sections) {
    assert.ok(s.sources.length > 0);
    for (const id of s.sources) assert.ok(leadershipSources[id], `${s.heading}: unknown source ${id}`);
  }
  const text = JSON.stringify(trainingGuide);
  assert.doesNotMatch(text, /equivalent to|is the same as|equals|corresponds to/i);
  assert.match(text, /makes no comparison/);
  assert.match(text, /Strong, Competent and Needs developing/);
});
