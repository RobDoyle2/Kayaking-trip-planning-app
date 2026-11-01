/**
 * Post-trip review. The self-rating areas are the headings on the British Canoeing Sea Kayak Leader Skills Checklist
 * (October 2021), rated Strong, Competent or Develop as the checklist does. The checklist was read through the project
 * notes, not the original file.
 */

export type Rating = 'Strong' | 'Competent' | 'Develop';
export const ratings: Rating[] = ['Strong', 'Competent', 'Develop'];

export interface RatingArea {
  id: string;
  title: string;
  items: { id: string; label: string }[];
}

export const ratingAreas: RatingArea[] = [
  {
    id: 'A',
    title: 'A. Participant-focused leadership',
    items: [
      { id: 'a-judgement', label: 'Judgement and decision making' },
      { id: 'a-venue', label: 'Venue selection and use' },
      { id: 'a-safety', label: 'Safety frameworks' },
      { id: 'a-vision', label: 'Vision (an inspirational role model)' },
      { id: 'a-support', label: 'Positive support to group members' },
      { id: 'a-style', label: 'Leadership style and behaviours' },
      { id: 'a-group-kit', label: 'Group and safety equipment' },
      { id: 'a-personal-kit', label: 'Personal equipment' },
      { id: 'a-impact', label: 'Impact on the environment and others' },
    ],
  },
  {
    id: 'B',
    title: 'B. Personal paddling',
    items: [
      { id: 'b-technical', label: 'Applied technical skills' },
      { id: 'b-tactical', label: 'Tactical paddling skills' },
      { id: 'b-awareness', label: 'Physical and mental awareness' },
    ],
  },
  {
    id: 'C',
    title: 'C. Rescue',
    items: [
      { id: 'c-deep', label: 'Deep-water rescue' },
      { id: 'c-swamped', label: 'Swamped sea kayak' },
      { id: 'c-landing', label: 'Landing an injured paddler' },
      { id: 'c-tow', label: 'Towing a casualty' },
      { id: 'c-separated', label: 'Dealing with a separated paddler and kayak' },
      { id: 'c-unconscious', label: 'Rescuing an unconscious paddler' },
      { id: 'c-incident', label: 'Incident management' },
    ],
  },
  {
    id: 'D',
    title: 'D. Background knowledge',
    items: [
      { id: 'd-equipment', label: 'Equipment' },
      { id: 'd-safety', label: 'Safety' },
      { id: 'd-weather', label: 'Weather, planning and navigation' },
      { id: 'd-access', label: 'Access and environment' },
      { id: 'd-experience', label: 'Experience' },
      { id: 'd-deployment', label: 'Deployment matters and leadership responsibilities' },
    ],
  },
];

export interface ReviewField {
  id: string;
  label: string;
  hint?: string;
  long?: boolean;
}

export const reviewFields: ReviewField[] = [
  { id: 'tripName', label: 'Trip name' },
  { id: 'date', label: 'Date' },
  { id: 'leader', label: 'Leader' },
  { id: 'wentWell', label: 'What went well', long: true },
  { id: 'change', label: 'What to change next time', long: true },
  {
    id: 'incidents',
    label: 'Incidents and near misses',
    hint: 'Report anything that needs reporting through the club’s own procedure. This note is only for your records.',
    long: true,
  },
  { id: 'reflection', label: 'Reflective practice', hint: 'What did the trip teach you as a leader?', long: true },
  { id: 'actions', label: 'Action points', long: true },
];

export interface Review {
  values: Record<string, string>;
  ratings: Record<string, string>;
}

export function isReview(x: unknown): x is Review {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as { values?: unknown; ratings?: unknown };
  const strings = (o: unknown) =>
    typeof o === 'object' && o !== null && !Array.isArray(o) && Object.values(o as Record<string, unknown>).every((v) => typeof v === 'string');
  if (!strings(r.values) || !strings(r.ratings)) return false;
  return Object.values(r.ratings as Record<string, string>).every((v) => (ratings as string[]).includes(v));
}

export function reviewText(review: Review): string {
  const out: string[] = ['Post-trip review', ''];
  for (const f of reviewFields) out.push(`${f.label}: ${(review.values[f.id] ?? '').trim() || 'Not filled in'}`);
  const rated = ratingAreas.flatMap((a) => a.items.filter((i) => review.ratings[i.id]).map((i) => `${a.id}. ${i.label}: ${review.ratings[i.id]}`));
  out.push('');
  out.push('Self-rating (Strong, Competent or Develop), for the areas this trip tested:');
  if (rated.length === 0) out.push('- None rated');
  for (const r of rated) out.push(`- ${r}`);
  return out.join('\n');
}
