import assert from 'node:assert/strict';
import test from 'node:test';
import { leadershipSources } from '../leadership/sources';
import {
  addOneHour,
  cablesToNm,
  currentOffset,
  decodeAtlasRate,
  formatClock,
  nmToCables,
  parseClock,
  parseNumber,
  ruleOfThirds,
  ruleOfTwelfths,
  streamSpeed,
  timeFromHighWater,
  twelfthsPerHour,
} from './calc';
import { navReferenceGuide } from './reference';
import { liveStatus, tideLinks, tidesGuide } from './tides';
import { vhfStations, workingChannel } from './vhf';
import { awardWindLimitForce, beaufort, weatherGuide, weatherLinks } from './weather';
import { oileainRegions } from './oileain';

test('numbers are read the way people type them, and bad input is explained', () => {
  const ok = (t: string, o = {}) => {
    const r = parseNumber(t, o);
    return r.ok ? r.value : r.message;
  };
  assert.equal(ok('2.5'), 2.5);
  assert.equal(ok('2,5'), 2.5);
  assert.equal(ok(' 3 '), 3);
  assert.match(String(ok('')), /empty/);
  assert.match(String(ok('abc', { label: 'Speed' })), /Speed must be a number/);
  assert.match(String(ok('-1', { label: 'Rate' })), /Rate cannot be negative/, 'a sign is refused unless allowed');
  assert.equal(ok('-1.5', { allowNegative: true }), -1.5);
  assert.match(String(ok('1e5')), /must be a number/);
  assert.match(String(ok('NaN')), /must be a number/);
  assert.match(String(ok('5', { max: 4, label: 'Hours' })), /Hours must be no more than 4/);
  assert.match(String(ok('0', { min: 1, label: 'Time' })), /Time must be at least 1/);
});

test('stream speed reproduces the worked example in the Pilotage deck: 0.7 NM in 10 min is 4.2 kn, stream 1.2 kn with a 3 kn boat', () => {
  const r = streamSpeed(0.7, 10, 3)!;
  assert.equal(r.groundSpeedKn, 4.2);
  assert.equal(r.streamKn, 1.2);
  assert.equal(r.direction, 'with');
});

test('stream speed says against, and none, and refuses nonsense', () => {
  assert.deepEqual(streamSpeed(0.5, 10, 4), { groundSpeedKn: 3, streamKn: 1, direction: 'against' });
  assert.equal(streamSpeed(0.5, 10, 3)!.direction, 'none');
  assert.equal(streamSpeed(0, 10, 3), null);
  assert.equal(streamSpeed(1, 0, 3), null);
  assert.equal(streamSpeed(1, 10, -1), null);
});

test('the offset angle uses 60 for a beam stream and 40 for a bow or quarter stream', () => {
  const beam = currentOffset(1, 3, 'beam');
  assert.ok(beam.ok && beam.degrees === 20 && beam.factor === 60);
  const quarter = currentOffset(1, 3, 'quarter');
  assert.ok(quarter.ok && quarter.degrees === 13.3 && quarter.factor === 40);
  const half = currentOffset(1.5, 3, 'beam');
  assert.ok(half.ok && half.degrees === 30);
});

test('the offset rule is refused when the stream is as fast as the paddler, or the speeds are impossible', () => {
  assert.equal(currentOffset(3, 3, 'beam').ok, false);
  assert.equal(currentOffset(4, 3, 'quarter').ok, false);
  assert.equal(currentOffset(1, 0, 'beam').ok, false);
  assert.equal(currentOffset(-1, 3, 'beam').ok, false);
});

test('the rule of thirds gives 1/3, 2/3, full, full, 2/3, 1/3 of the rate entered', () => {
  const rows = ruleOfThirds(3);
  assert.deepEqual(rows.map((r) => r.label), ['1/3', '2/3', 'full', 'full', '2/3', '1/3']);
  assert.deepEqual(rows.map((r) => r.rateKn), [1, 2, 3, 3, 2, 1]);
  assert.deepEqual(ruleOfThirds(2.4).map((r) => r.rateKn), [0.8, 1.6, 2.4, 2.4, 1.6, 0.8]);
});

test('the rule of twelfths moves 1, 2, 3, 3, 2, 1 twelfths and ends at the other water', () => {
  assert.deepEqual([...twelfthsPerHour], [1, 2, 3, 3, 2, 1]);
  const up = ruleOfTwelfths(0, 12, 'rising')!;
  assert.equal(up.rangeM, 12);
  assert.deepEqual(up.rows.map((r) => r.heightM), [1, 3, 6, 9, 11, 12]);
  const down = ruleOfTwelfths(0.5, 4.5, 'falling')!;
  assert.deepEqual(down.rows.map((r) => r.heightM), [4.17, 3.5, 2.5, 1.5, 0.83, 0.5]);
  assert.equal(down.rows.at(-1)!.heightM, 0.5, 'ends at low water');
  assert.equal(ruleOfTwelfths(2, 2, 'rising'), null);
  assert.equal(ruleOfTwelfths(3, 2, 'rising'), null);
});

test('the rule of twelfths works with a negative low water height', () => {
  const r = ruleOfTwelfths(-0.2, 3.4, 'rising')!;
  assert.equal(r.rangeM, 3.6);
  assert.equal(r.rows.at(-1)!.heightM, 3.4);
});

test('times from high water add or subtract hours and minutes and say when the day changes', () => {
  assert.deepEqual(timeFromHighWater('10:00', 'after', 4, 30), { time: '14:30', dayShift: 0 });
  assert.deepEqual(timeFromHighWater('10:00', 'before', 4, 40), { time: '05:20', dayShift: 0 });
  assert.deepEqual(timeFromHighWater('22:30', 'after', 4, 30), { time: '03:00', dayShift: 1 });
  assert.deepEqual(timeFromHighWater('01:10', 'before', 3, 0), { time: '22:10', dayShift: -1 });
  assert.deepEqual(timeFromHighWater('00:00', 'before', 0, 0), { time: '00:00', dayShift: 0 });
  assert.equal(timeFromHighWater('25:00', 'after', 1, 0), null);
  assert.equal(timeFromHighWater('ten', 'after', 1, 0), null);
});

test('clock parsing is strict and formatting wraps correctly', () => {
  assert.deepEqual(parseClock('9:05'), { h: 9, m: 5 });
  assert.equal(parseClock('24:00'), null);
  assert.equal(parseClock('12:60'), null);
  assert.equal(parseClock('1205'), null);
  assert.deepEqual(formatClock(-1), { time: '23:59', dayShift: -1 });
  assert.deepEqual(formatClock(1440), { time: '00:00', dayShift: 1 });
});

test('adding one hour for BST handles midnight', () => {
  assert.deepEqual(addOneHour('04:56'), { time: '05:56', dayShift: 0 });
  assert.deepEqual(addOneHour('23:30'), { time: '00:30', dayShift: 1 });
  assert.equal(addOneHour('bad'), null);
});

test('atlas rates decode as in the Tides deck: 03,05 and 12,23', () => {
  assert.deepEqual(decodeAtlasRate('03,05'), { neapsKn: 0.3, springsKn: 0.5 });
  assert.deepEqual(decodeAtlasRate('12,23'), { neapsKn: 1.2, springsKn: 2.3 });
  assert.deepEqual(decodeAtlasRate(' 12,23 '), { neapsKn: 1.2, springsKn: 2.3 });
  for (const bad of ['1.2', '12;23', '1,23', '123,45', '', 'ab,cd', '12,23,4']) assert.equal(decodeAtlasRate(bad), null, bad);
});

test('cables and nautical miles: 10 cables to the mile, and the Chartwork example', () => {
  assert.equal(cablesToNm(8.5), 0.85);
  assert.equal(nmToCables(0.85), 8.5);
  assert.equal(cablesToNm(10), 1);
  assert.equal(nmToCables(2), 20);
});

test('the Beaufort table has forces 0 to 12 in order, with rising wind speed ranges', () => {
  assert.deepEqual(beaufort.map((b) => b.force), Array.from({ length: 13 }, (_, i) => i));
  const lows = beaufort.map((b) => Number(b.knots.split(' ')[0]));
  assert.ok(lows.every((n, i) => i === 0 || n > lows[i - 1]!));
  assert.equal(beaufort[4]!.name, 'Moderate breeze');
  assert.equal(beaufort[4]!.knots, '11 to 16');
  assert.equal(awardWindLimitForce, 4);
});

test('the VHF table matches Marine Notice 61 of 2020 as read: 21 rows, 12 changed, working channels as listed', () => {
  assert.equal(vhfStations.length, 21);
  assert.equal(new Set(vhfStations.map((s) => s.name)).size, 21);
  assert.equal(vhfStations.filter((s) => s.oldChannel).length, 12);
  const by = Object.fromEntries(vhfStations.map((s) => [s.name, s]));
  const expected: Record<string, [string, string | undefined]> = {
    Bantry: ['05', '23'], Belmullet: ['63', '83'], Carlingford: ['04', undefined], 'Clew Bay': ['05', undefined], Clifden: ['03', '26'], Cork: ['02', '26'],
    'Donegal Bay': ['02', undefined], Dublin: ['03', '83'], Galway: ['04', undefined], 'Glen Head': ['03', '24'], 'Lough Derg': ['61', undefined], 'Lough Ree': ['62', undefined],
    'Malin Head': ['05', '23'], 'Mine Head': ['03', '83'], 'Mizen Head': ['04', undefined], Rosslare: ['05', '23'], Shannon: ['64', '28'], Valentia: ['62', '24'], 'Wicklow Head': ['02', undefined],
  };
  for (const [name, [working, old]] of Object.entries(expected)) {
    assert.equal(workingChannel(by[name]!), working, `${name} working channel`);
    assert.equal(by[name]!.oldChannel, old, `${name} old channel`);
  }
  assert.equal(workingChannel(by['Galley Head']!), null);
  assert.deepEqual(by['Galley Head']!.channels, ['16']);
  assert.equal(workingChannel(by['Malin Head (local, Lough Swilly and Lough Foyle)']!), '01');
  for (const s of vhfStations) assert.ok(s.channels[0] === '16', `${s.name} starts with channel 16`);
});

test('every station has channel 16, and channel 67 appears wherever the notice lists it', () => {
  const with67 = vhfStations.filter((s) => s.channels.includes('67')).map((s) => s.name);
  assert.equal(with67.length, 17);
  for (const name of ['Galley Head', 'Lough Derg', 'Lough Ree', 'Malin Head (local, Lough Swilly and Lough Foyle)']) assert.ok(!with67.includes(name));
});

test('every guide section on the navigation pages names real sources', () => {
  for (const g of [navReferenceGuide, tidesGuide, weatherGuide]) {
    for (const s of g.sections) {
      assert.ok(s.sources.length > 0, `${g.title}: ${s.heading} has no source`);
      for (const id of s.sources) assert.ok(leadershipSources[id], `${g.title}: unknown source ${id}`);
    }
  }
});

test('the navigation pages do not claim live data and say what each link is', () => {
  const text = JSON.stringify([navReferenceGuide, tidesGuide, weatherGuide, tideLinks, weatherLinks, liveStatus]);
  assert.doesNotMatch(text, /updated every|live reading shown|real-time/i);
  for (const l of [...tideLinks, ...weatherLinks]) {
    assert.match(l.url, /^https:\/\//);
    assert.ok(l.caution.length > 20, `${l.name} has a caution`);
  }
});

test('the tide link for Marine Institute data warns about the datum difference between its datasets', () => {
  const mi = tideLinks.find((l) => /Marine Institute/.test(l.name))!;
  assert.match(mi.caution, /Lowest Astronomical Tide/);
  assert.match(mi.caution, /datum/);
});

test('the Oileáin index lists the four standard ports counted from the PDF', () => {
  const ports = oileainRegions.map((r) => r.port).join(' ');
  for (const p of ['Belfast', 'Dublin', 'Cobh', 'Galway']) assert.match(ports, new RegExp(p));
  assert.equal(oileainRegions.find((r) => r.coast === 'East Coast')!.port, 'Dublin');
});

test('the reference guide leaves out the slide figures flagged as garbled', () => {
  const text = JSON.stringify(navReferenceGuide);
  assert.doesNotMatch(text, /31\.5|36°|1\.15/);
});
