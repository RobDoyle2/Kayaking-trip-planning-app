import { ratingAreas, ratings } from '../leadership/review';

/**
 * The skills development plan: the line-by-line self-rating (Strong, Competent or Develop) from the Sea Kayak Leader Skills
 * Checklist, six boxes for notes (the same six the checklist's own development plan page has), and an action list.
 * It is a personal record. It does not assess anyone, and it adds no advice of its own.
 */

export const planAreas = ratingAreas;

export interface NoteBox {
  id: string;
  label: string;
  hint?: string;
}

/** The six headings on the checklist's Candidate Development Plan page. */
export const noteBoxes: NoteBox[] = [
  { id: 'leadership', label: 'Participant-focused leadership' },
  { id: 'paddling', label: 'Personal paddling' },
  { id: 'rescue', label: 'Rescues and incident management' },
  { id: 'background', label: 'Background knowledge and understanding' },
  { id: 'experience', label: 'Experience' },
  {
    id: 'reflective',
    label: 'Reflective practice',
    hint: 'The checklist has this box but does not rate it, so this app does not rate it either. Use it to note what you are learning from your trips.',
  },
];

export interface ActionItem {
  id: string;
  text: string;
  /** A note box id, or '' for none. */
  area: string;
  /** Free text, such as "before May" or "next rescue practice". */
  when: string;
  done: boolean;
}

export interface DevelopmentPlan {
  ratings: Record<string, string>;
  notes: Record<string, string>;
  actions: ActionItem[];
}

export const MAX_ACTIONS = 30;
const MAX_TEXT = 3000;

export const emptyPlan: DevelopmentPlan = { ratings: {}, notes: {}, actions: [] };

const allItems = planAreas.flatMap((a) => a.items.map((i) => ({ ...i, area: a })));
export const totalItems = allItems.length;

export function newAction(id: string): ActionItem {
  return { id, text: '', area: '', when: '', done: false };
}

export function addAction(actions: ActionItem[], action: ActionItem): ActionItem[] {
  return actions.length >= MAX_ACTIONS ? actions : [...actions, action];
}

export function updateAction(actions: ActionItem[], id: string, patch: Partial<Omit<ActionItem, 'id'>>): ActionItem[] {
  return actions.map((a) => (a.id === id ? { ...a, ...patch, text: (patch.text ?? a.text).slice(0, 500), when: (patch.when ?? a.when).slice(0, 200) } : a));
}

export function removeAction(actions: ActionItem[], id: string): ActionItem[] {
  return actions.filter((a) => a.id !== id);
}

export function setRating(plan: DevelopmentPlan, itemId: string, value: string): DevelopmentPlan {
  const next = { ...plan.ratings };
  if (value === '') delete next[itemId];
  else if ((ratings as string[]).includes(value)) next[itemId] = value;
  return { ...plan, ratings: next };
}

export function setNote(plan: DevelopmentPlan, boxId: string, value: string): DevelopmentPlan {
  return { ...plan, notes: { ...plan.notes, [boxId]: value.slice(0, MAX_TEXT) } };
}

export interface PlanSummary {
  total: number;
  rated: number;
  strong: number;
  competent: number;
  develop: number;
  /** Lines rated Develop, with their area letter. */
  developItems: { area: string; label: string }[];
}

export function summarise(plan: DevelopmentPlan): PlanSummary {
  const out: PlanSummary = { total: totalItems, rated: 0, strong: 0, competent: 0, develop: 0, developItems: [] };
  for (const item of allItems) {
    const r = plan.ratings[item.id];
    if (!r) continue;
    out.rated++;
    if (r === 'Strong') out.strong++;
    else if (r === 'Competent') out.competent++;
    else if (r === 'Develop') {
      out.develop++;
      out.developItems.push({ area: item.area.id, label: item.label });
    }
  }
  return out;
}

const NOT_FILLED = 'Not filled in';

export function boxLabel(id: string): string {
  return noteBoxes.find((b) => b.id === id)?.label ?? 'No area';
}

export function planText(plan: DevelopmentPlan): string {
  const s = summarise(plan);
  const out: string[] = [
    'Skills development plan',
    'A personal self-assessment using the lines of the Sea Kayak Leader Skills Checklist (BCAB). A record for your own use: it does not assess you.',
    '',
    'SUMMARY',
    `Rated: ${s.rated} of ${s.total}. Strong: ${s.strong}. Competent: ${s.competent}. Develop: ${s.develop}.`,
    '',
    'AREAS TO DEVELOP (rated Develop)',
  ];
  if (s.developItems.length === 0) out.push('- None rated Develop');
  for (const d of s.developItems) out.push(`- ${d.area}. ${d.label}`);
  out.push('');
  out.push('RATINGS');
  for (const area of planAreas) {
    out.push(area.title);
    for (const item of area.items) out.push(`- ${item.label}: ${plan.ratings[item.id] ?? 'Not rated'}`);
  }
  out.push('', 'NOTES AND ACTION POINTS');
  for (const b of noteBoxes) out.push(`${b.label}: ${(plan.notes[b.id] ?? '').trim() || NOT_FILLED}`);
  out.push('', 'ACTION LIST');
  const open = plan.actions.filter((a) => !a.done);
  const done = plan.actions.filter((a) => a.done);
  if (plan.actions.length === 0) out.push('- No actions listed');
  const line = (a: ActionItem) => {
    const meta = [a.area ? boxLabel(a.area) : '', a.when.trim() ? `by when: ${a.when.trim()}` : ''].filter(Boolean).join('; ');
    return `- [${a.done ? 'x' : ' '}] ${a.text.trim() || NOT_FILLED}${meta ? ` (${meta})` : ''}`;
  };
  for (const a of open) out.push(line(a));
  for (const a of done) out.push(line(a));
  return out.join('\n');
}

/* ---------- Validation, used when reading saved data and import files ---------- */

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown, max: number): x is string => typeof x === 'string' && x.length <= max;

export function isDevelopmentPlan(x: unknown): x is DevelopmentPlan {
  if (!isObj(x) || !isObj(x.ratings) || !isObj(x.notes) || !Array.isArray(x.actions)) return false;
  if (Object.keys(x.ratings).length > 100 || !Object.entries(x.ratings).every(([k, v]) => k.length <= 40 && typeof v === 'string' && (ratings as string[]).includes(v))) return false;
  if (Object.keys(x.notes).length > 20 || !Object.entries(x.notes).every(([k, v]) => k.length <= 40 && isStr(v, MAX_TEXT))) return false;
  if (x.actions.length > MAX_ACTIONS) return false;
  return x.actions.every((a) => isObj(a) && isStr(a.id, 40) && isStr(a.text, 500) && isStr(a.area, 40) && isStr(a.when, 200) && typeof a.done === 'boolean');
}
