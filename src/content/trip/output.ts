import { applicableGroups, dayGroups, tripGroups, tripTypeInfo, type FieldGroup } from './fields';
import { finalChecklistGroups, finalChecklistProgress } from './checklist';
import { limitFindings, limitSource } from './limits';
import { tripDateRange, tripGaps, tripTitle, type Trip } from './trip';

/** The printed plan as plain data, so the screen, the print view, the text file and the PDF all say the same thing. */
export interface PlanRow {
  label: string;
  value: string;
  /** True when the value is blank, so output shows "Not filled in". */
  gap: boolean;
}

export interface PlanSection {
  heading: string;
  rows: PlanRow[];
  /** Lines for notes under the rows. */
  notes?: string[];
}

export interface PlanDoc {
  title: string;
  subtitle: string;
  gaps: string[];
  sections: PlanSection[];
  footer: string;
}

export const NOT_FILLED = 'Not filled in';

export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function rowsFor(groups: FieldGroup[], values: Record<string, string>): PlanRow[] {
  const rows: PlanRow[] = [];
  for (const g of groups) {
    for (const f of g.fields) {
      const raw = (values[f.id] ?? '').trim();
      rows.push({ label: f.label, value: raw === '' ? NOT_FILLED : f.kind === 'date' ? formatDate(raw) : raw, gap: raw === '' });
    }
  }
  return rows;
}

export function buildPlan(trip: Trip): PlanDoc {
  const info = tripTypeInfo(trip.type);
  const range = tripDateRange(trip);
  const gaps = tripGaps(trip).map((g) => `${g.scope}: ${g.label}`);
  const sections: PlanSection[] = [];

  const people = applicableGroups(tripGroups, trip.type).filter((g) => g.id === 'people');
  sections.push({ heading: 'People', rows: rowsFor(people, trip.values) });

  trip.days.forEach((day, i) => {
    const prefix = trip.type === 'day' ? '' : `Day ${i + 1}: `;
    const dayGs = applicableGroups(dayGroups, trip.type);
    for (const g of dayGs) {
      const rows = rowsFor([g], day.values);
      if (g.id === 'day-route') {
        day.stops.forEach((s, n) => {
          const times = [s.eta && `ETA ${s.eta}`, s.etd && `ETD ${s.etd}`].filter(Boolean).join(', ');
          rows.push({
            label: `Stop ${n + 1}`,
            value: [s.place.trim() || NOT_FILLED, s.notes.trim(), times].filter(Boolean).join('. '),
            gap: s.place.trim() === '',
          });
        });
      }
      sections.push({ heading: `${prefix}${g.title}`, rows });
    }
  });

  const rest = applicableGroups(tripGroups, trip.type).filter((g) => g.id !== 'people');
  for (const g of rest) sections.push({ heading: g.title, rows: rowsFor([g], trip.values) });

  if (trip.limitsOn) {
    const findings = limitFindings(trip.values);
    sections.push({
      heading: 'Award limit check (information only)',
      rows: findings.map((f) => ({ label: f.label, value: f.message, gap: f.status === 'missing' || f.status === 'invalid' })),
      notes: [
        `Limits are from the ${limitSource}. They belong to the award, not to ECSKC, and this check never says a trip is safe or unsafe.`,
      ],
    });
  }

  const progress = finalChecklistProgress(trip.checks);
  const unticked: string[] = [];
  for (const g of finalChecklistGroups) for (const item of g.items) if (trip.checks[item.id] !== true) unticked.push(item.text);
  sections.push({
    heading: 'Final planning checklist',
    rows: [{ label: 'Ticked', value: `${progress.done} of ${progress.total}`, gap: progress.done < progress.total }],
    notes: unticked.length === 0 ? ['Every item is ticked.'] : ['Not yet ticked:', ...unticked.map((t) => `- ${t}`)],
  });

  return {
    title: tripTitle(trip),
    subtitle: [info.title, range ? (range.includes(' to ') ? range.split(' to ').map(formatDate).join(' to ') : formatDate(range)) : 'Date not filled in'].join(' | '),
    gaps,
    sections,
    footer: 'Made with the Sea Kayaking Hub, a planning aid. It does not replace the leader’s judgement. Nothing in this plan was filled in by the app.',
  };
}

export function planText(doc: PlanDoc): string {
  const lines: string[] = [doc.title, doc.subtitle, ''];
  if (doc.gaps.length > 0) {
    lines.push(`STILL TO FILL IN (${doc.gaps.length})`, ...doc.gaps.map((g) => `- ${g}`), '');
  } else {
    lines.push('Every required field is filled in.', '');
  }
  for (const s of doc.sections) {
    lines.push(s.heading.toUpperCase());
    for (const r of s.rows) lines.push(`${r.label}: ${r.value}`);
    for (const n of s.notes ?? []) lines.push(n);
    lines.push('');
  }
  lines.push(doc.footer);
  return lines.join('\n');
}

/** The plan as PDF blocks. */
export function planPdfBlocks(doc: PlanDoc): import('../../lib/pdf').PdfBlock[] {
  const blocks: import('../../lib/pdf').PdfBlock[] = [
    { kind: 'title', text: doc.title },
    { kind: 'subtitle', text: doc.subtitle },
    { kind: 'gap' },
  ];
  if (doc.gaps.length > 0) {
    blocks.push({ kind: 'heading', text: `Still to fill in (${doc.gaps.length})` });
    for (const g of doc.gaps) blocks.push({ kind: 'para', runs: [{ text: `- ${g}` }], indent: 8 });
  } else {
    blocks.push({ kind: 'para', runs: [{ text: 'Every required field is filled in.', bold: true }] });
  }
  for (const s of doc.sections) {
    blocks.push({ kind: 'heading', text: s.heading });
    for (const r of s.rows) {
      // Keep the line breaks the user typed (a list of names, say): the first line follows the label, the rest are indented.
      const [first = '', ...rest] = r.value.split(/\r?\n/);
      blocks.push({ kind: 'para', runs: [{ text: `${r.label}: `, bold: true }, { text: first }] });
      for (const line of rest) blocks.push({ kind: 'para', runs: [{ text: line }], indent: 12 });
    }
    for (const n of s.notes ?? []) blocks.push({ kind: 'para', runs: [{ text: n }], indent: n.startsWith('- ') ? 8 : 0 });
  }
  blocks.push({ kind: 'gap' }, { kind: 'para', runs: [{ text: doc.footer }] });
  return blocks;
}
