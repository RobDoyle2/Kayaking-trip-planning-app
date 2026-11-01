/**
 * SHEETS briefing: the structure and prompts of the framework as published on the saturnbull sea kayaking blog.
 * Source: https://saturnbull.co.uk/sheets/ (read 1 November 2026). The page carries "2026 © saturnbull", names no author or date,
 * and states no licence for reuse. The prompts below are paraphrased, not copied, and the headings are the page's own.
 *
 * The page gives six headings, one per letter, and does NOT spell out the words behind the letters. This app
 * therefore shows the headings only and never expands the acronym.
 *
 * Not yet confirmed: whether ECSKC uses this version of SHEETS, and permission to reuse the wording publicly.
 */

export type FieldKind = 'text' | 'longtext' | 'check' | 'time';

export interface SheetsField {
  id: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  /** Needed for a complete briefing. Blank required fields are listed as missing. */
  required?: boolean;
}

export interface SheetsSection {
  id: string;
  letter: 'S' | 'H' | 'E' | 'T';
  /** The heading exactly as the source page gives it. */
  heading: string;
  /** What the source page asks the leader to cover, in our own words. */
  prompts: string[];
  fields: SheetsField[];
}

export const sheetsSource = {
  title: 'SHEETS (saturnbull sea kayaking blog)',
  url: 'https://saturnbull.co.uk/sheets/',
  read: '1 November 2026',
  notice: '2026 © saturnbull. No author, date or reuse licence is stated on the page.',
};

export const sheetsMeta: SheetsField[] = [
  { id: 'tripName', label: 'Trip name', kind: 'text', required: true },
  { id: 'date', label: 'Date', kind: 'text', hint: 'For example 14 June 2026', required: true },
  { id: 'leader', label: 'Leader', kind: 'text', required: true },
  { id: 'launch', label: 'Launch place', kind: 'text', required: true },
];

export const sheetsSections: SheetsSection[] = [
  {
    id: 'safety-signals',
    letter: 'S',
    heading: 'Safety and Signals',
    prompts: [
      'Decide how tightly you will control the group in today’s conditions, and name a number two.',
      'Ask everyone to keep everyone else in sight.',
      'Say what to do if someone falls in, including the STOP call, and what happens if an incident occurs.',
      'Teach the signals for stop, left, right, come to me and OK.',
    ],
    fields: [
      { id: 'groupControl', label: 'How you will control the group today', kind: 'text', required: true },
      { id: 'numberTwo', label: 'Number two (name)', kind: 'text', required: true },
      { id: 'inSight', label: 'Everyone knows to keep each other in sight', kind: 'check' },
      { id: 'fallIn', label: 'What to do if someone falls in', kind: 'longtext', required: true },
      { id: 'incident', label: 'What happens if an incident occurs', kind: 'longtext', required: true },
      { id: 'sigStop', label: 'Signal taught: stop', kind: 'check' },
      { id: 'sigLeft', label: 'Signal taught: left', kind: 'check' },
      { id: 'sigRight', label: 'Signal taught: right', kind: 'check' },
      { id: 'sigCome', label: 'Signal taught: come to me', kind: 'check' },
      { id: 'sigOk', label: 'Signal taught: OK', kind: 'check' },
    ],
  },
  {
    id: 'humans',
    letter: 'H',
    heading: 'Humans',
    prompts: [
      'Ask whether anyone needs the group to be aware of anything.',
      'Check medicines, food, water and hot drinks.',
      'Confirm who is the shore contact.',
      'Talk through each person’s experience.',
    ],
    fields: [
      { id: 'humansAsked', label: 'Asked whether anyone needs the group to be aware of anything', kind: 'check' },
      { id: 'awareness', label: 'Anything the group needs to be aware of', kind: 'longtext', hint: 'Write "none" if nothing was raised.' },
      { id: 'provisions', label: 'Medicines, food, water and hot drinks checked', kind: 'check' },
      { id: 'shoreContact', label: 'Shore contact (name and phone number)', kind: 'text', required: true },
      { id: 'experience', label: 'Each person’s experience', kind: 'longtext', hint: 'One person per line.', required: true },
    ],
  },
  {
    id: 'equipment',
    letter: 'E',
    heading: 'Equipment',
    prompts: [
      'Check everyone is dressed appropriately and carries safety gear they know how to use, such as a towline.',
      'Have everyone check each other over, including drysuit zips and helmets if required.',
      'Confirm the first aid kit, group shelter, VHF radio and channel, warm clothing, food and water.',
    ],
    fields: [
      { id: 'dressed', label: 'Everyone is dressed appropriately', kind: 'check' },
      { id: 'safetyGear', label: 'Everyone carries safety gear they know how to use (for example a towline)', kind: 'check' },
      { id: 'checkOver', label: 'Check-over done (drysuit zips, helmets if required)', kind: 'check' },
      { id: 'firstAid', label: 'First aid kit: who carries it', kind: 'text', required: true },
      { id: 'shelter', label: 'Group shelter: who carries it', kind: 'text' },
      { id: 'vhf', label: 'VHF radio and channel', kind: 'text', required: true },
      { id: 'warmFood', label: 'Warm clothing, food and water confirmed', kind: 'check' },
    ],
  },
  {
    id: 'environment',
    letter: 'E',
    heading: 'Environment',
    prompts: [
      'State the destination or objective and the distance.',
      'Name the obstacles: tide, tidal flows, overfalls, swell, wind and weather.',
      'Identify potential stops and get-outs.',
    ],
    fields: [
      { id: 'objective', label: 'Destination or objective', kind: 'text', required: true },
      { id: 'distance', label: 'Distance', kind: 'text', hint: 'Say the unit, for example 8 nautical miles.', required: true },
      { id: 'tide', label: 'Tide and tidal flows', kind: 'longtext' },
      { id: 'overfalls', label: 'Overfalls', kind: 'text' },
      { id: 'swellWind', label: 'Swell, wind and weather', kind: 'longtext' },
      { id: 'stops', label: 'Potential stops and get-outs', kind: 'longtext', required: true },
    ],
  },
  {
    id: 'timings',
    letter: 'T',
    heading: 'Timings',
    prompts: ['State how long the trip will take, when you expect to be back, and the distance to be covered.'],
    fields: [
      { id: 'duration', label: 'Trip duration', kind: 'text', hint: 'For example 4 hours on the water.', required: true },
      { id: 'returnTime', label: 'Expected return time', kind: 'time', required: true },
    ],
  },
  {
    id: 'safety-signals-qa',
    letter: 'S',
    heading: 'Safety and signals (Q&A)',
    prompts: [
      'Go back over the first Safety and Signals section, but this time ask the group questions so that they say the key points back to you.',
    ],
    fields: [{ id: 'qaDone', label: 'The group has said the key points back', kind: 'check' }],
  },
];

export type SheetsValues = Record<string, string | boolean>;

const allFields: SheetsField[] = [...sheetsMeta, ...sheetsSections.flatMap((s) => s.fields)];

export function fieldById(id: string): SheetsField | undefined {
  return allFields.find((f) => f.id === id);
}

function text(values: SheetsValues, id: string): string {
  const v = values[id];
  return typeof v === 'string' ? v.trim() : '';
}

function ticked(values: SheetsValues, id: string): boolean {
  return values[id] === true;
}

/** Required fields that are still blank, in the order they appear. */
export function missingFields(values: SheetsValues): SheetsField[] {
  return allFields.filter((f) => f.required && text(values, f.id) === '');
}

/** Checkbox fields the leader has not ticked, in the order they appear. */
export function unconfirmedChecks(values: SheetsValues): SheetsField[] {
  return allFields.filter((f) => f.kind === 'check' && !ticked(values, f.id));
}

export interface BriefingLine {
  label: string;
  value: string;
  /** true when the leader left a required field empty, or did not tick a check */
  gap: boolean;
}

export interface BriefingSection {
  letter: string;
  heading: string;
  lines: BriefingLine[];
}

/** The briefing as structured data: the on-screen view and the downloaded text are both made from this. */
export function buildBriefing(values: SheetsValues): { meta: BriefingLine[]; sections: BriefingSection[] } {
  const line = (f: SheetsField): BriefingLine => {
    if (f.kind === 'check') {
      const yes = ticked(values, f.id);
      return { label: f.label, value: yes ? 'Yes' : 'Not confirmed', gap: !yes };
    }
    const v = text(values, f.id);
    return { label: f.label, value: v === '' ? 'Not filled in' : v, gap: v === '' && !!f.required };
  };
  const meta = sheetsMeta.map(line);
  const sections = sheetsSections.map((s) => {
    const lines = s.fields.map(line);
    if (s.id === 'timings') {
      const distance = text(values, 'distance');
      lines.push({ label: 'Distance to be covered', value: distance === '' ? 'Not filled in' : distance, gap: distance === '' });
    }
    return { letter: s.letter, heading: s.heading, lines };
  });
  return { meta, sections };
}

/** Plain-text version for copying, downloading or pasting into a message. */
export function briefingText(values: SheetsValues): string {
  const { meta, sections } = buildBriefing(values);
  const out: string[] = [];
  const title = text(values, 'tripName') || 'Trip briefing';
  out.push(`SHEETS briefing: ${title}`);
  out.push('');
  for (const m of meta) out.push(`${m.label}: ${m.value}`);
  for (const s of sections) {
    out.push('');
    out.push(`${s.letter}: ${s.heading}`);
    for (const l of s.lines) out.push(`- ${l.label}: ${l.value}`);
  }
  const missing = missingFields(values);
  out.push('');
  if (missing.length === 0) out.push('All required fields are filled in.');
  else out.push(`Still to fill in (${missing.length}): ${missing.map((m) => m.label).join('; ')}.`);
  out.push('');
  out.push(`Framework: ${sheetsSource.title}, ${sheetsSource.url}. Prepared with the Sea Kayaking Hub; a planning aid, not a substitute for the leader’s judgement.`);
  return out.join('\n');
}

/** How many fields in a section are done (text filled, check ticked), for the progress shown on each section. */
export function sectionProgress(section: SheetsSection, values: SheetsValues): { done: number; total: number } {
  const done = section.fields.filter((f) => (f.kind === 'check' ? ticked(values, f.id) : text(values, f.id) !== '')).length;
  return { done, total: section.fields.length };
}
