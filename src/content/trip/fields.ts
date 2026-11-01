/**
 * The planning fields for the three kinds of trip, from the approved specification (section B, Trip Planning).
 * Each field says which trip types use it and whether the plan is incomplete without it.
 * Nothing here is advice: the labels and hints say what to type in, and the app never fills a value in for the user.
 */

export type TripType = 'day' | 'multi-day' | 'camping';

export const tripTypes: { id: TripType; title: string; short: string; path: string }[] = [
  { id: 'day', title: 'Day trip', short: 'Day trip', path: '/trip-planning/day' },
  { id: 'multi-day', title: 'Multi-day expedition without camping', short: 'Multi-day, no camping', path: '/trip-planning/multi-day' },
  { id: 'camping', title: 'Multi-day expedition with camping', short: 'Multi-day, camping', path: '/trip-planning/camping' },
];

export function tripTypeInfo(type: TripType) {
  return tripTypes.find((t) => t.id === type) ?? tripTypes[0]!;
}

export type FieldKind = 'text' | 'longtext' | 'date';

export interface TripField {
  id: string;
  label: string;
  hint?: string;
  kind: FieldKind;
  /** The plan is listed as incomplete while this is blank. */
  required?: boolean;
  /** Trip types that use the field. Missing means all three. */
  types?: TripType[];
}

export interface FieldGroup {
  id: string;
  title: string;
  intro?: string;
  fields: TripField[];
}

/** Fields that belong to the whole trip. */
export const tripGroups: FieldGroup[] = [
  {
    id: 'people',
    title: 'People',
    fields: [
      { id: 'name', label: 'Trip name', kind: 'text', required: true },
      { id: 'leader', label: 'Leader', kind: 'text', required: true },
      { id: 'assistant', label: 'Assistant leader', kind: 'text' },
      {
        id: 'participants',
        label: 'Participants',
        kind: 'longtext',
        required: true,
        hint: 'One name per line. You can add each person’s experience or award level.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Equipment, safety, emergency and communications',
    intro: 'Type in your own plan. The Leadership section has the Equipment and safety check, the Risk assessment and the Emergency card.',
    fields: [
      {
        id: 'shoreContact',
        label: 'Shore contact (name and phone number)',
        kind: 'text',
        required: true,
        hint: 'The person who knows your plan and when you expect to finish.',
      },
      {
        id: 'groupEquipment',
        label: 'Group equipment and safety gear',
        kind: 'longtext',
        required: true,
        hint: 'For example first-aid kit, repair kit, shelter, tow lines. Say who carries what.',
      },
      { id: 'firstAid', label: 'First-aid kit: who carries it', kind: 'text', required: true },
      {
        id: 'comms',
        label: 'Communications',
        kind: 'longtext',
        required: true,
        hint: 'Radio channel, phones, how you will signal, and where there may be no signal.',
      },
      {
        id: 'emergencyPlan',
        label: 'Emergency plan and escape routes',
        kind: 'longtext',
        required: true,
        hint: 'Where you can land if you need to, and what you will do if someone needs help.',
      },
    ],
  },
  {
    id: 'logistics',
    title: 'Transport and accommodation',
    fields: [
      {
        id: 'transport',
        label: 'Transport',
        kind: 'longtext',
        required: true,
        hint: 'Who drives, where vehicles are left, and how you get back to them.',
      },
      {
        id: 'accommodation',
        label: 'Accommodation',
        kind: 'longtext',
        required: true,
        types: ['multi-day'],
        hint: 'Where you stay each night, and who has booked it.',
      },
    ],
  },
  {
    id: 'camping',
    title: 'Camping',
    intro:
      'ECSKC has not supplied a camping kit list, so these are free text. The app does not suggest what to take.',
    fields: [
      { id: 'campGear', label: 'Camping gear', kind: 'longtext', required: true, types: ['camping'] },
      { id: 'food', label: 'Food', kind: 'longtext', required: true, types: ['camping'] },
      { id: 'water', label: 'Drinking water', kind: 'longtext', required: true, types: ['camping'] },
    ],
  },
  {
    id: 'other',
    title: 'Other notes',
    fields: [{ id: 'notes', label: 'Anything else', kind: 'longtext' }],
  },
];

/** Fields repeated for each day (a day trip has one day). */
export const dayGroups: FieldGroup[] = [
  {
    id: 'day-route',
    title: 'Route',
    fields: [
      { id: 'date', label: 'Date', kind: 'date', required: true },
      { id: 'launch', label: 'Launch place', kind: 'text', required: true },
      { id: 'landing', label: 'Landing place', kind: 'text', required: true },
      { id: 'route', label: 'Route', kind: 'longtext', required: true },
      { id: 'distance', label: 'Distance', kind: 'text', required: true, hint: 'Say the unit, for example 8 nautical miles.' },
      { id: 'estTime', label: 'Estimated time on the water', kind: 'text', required: true },
    ],
  },
  {
    id: 'day-weather',
    title: 'Weather and sea state',
    fields: [
      { id: 'weather', label: 'Weather', kind: 'text', required: true },
      { id: 'wind', label: 'Wind', kind: 'text', required: true },
      { id: 'seaState', label: 'Sea state and swell', kind: 'text', required: true },
      {
        id: 'forecastSource',
        label: 'Forecast source and when you checked it',
        kind: 'text',
        hint: 'The app does not fetch weather. Type in what you read and where you read it.',
      },
    ],
  },
  {
    id: 'day-tide',
    title: 'Tides and tidal streams',
    intro: 'Type in values from your own tide tables or guide. The app does not calculate or fetch tides yet.',
    fields: [
      { id: 'tidalPort', label: 'Tide times are for this port', kind: 'text' },
      {
        id: 'tideTimes',
        label: 'High and low water times',
        kind: 'longtext',
        required: true,
        hint: 'Say whether the times are UT or local clock time.',
      },
      {
        id: 'streams',
        label: 'Tidal streams on the route',
        kind: 'longtext',
        required: true,
        hint: 'Direction, start time and rate for each place. Write “none” if there are none.',
      },
      { id: 'navNotes', label: 'Navigation notes', kind: 'longtext' },
    ],
  },
  {
    id: 'day-camp',
    title: 'Camp for this night',
    fields: [
      { id: 'campSite', label: 'Camp site', kind: 'text', required: true, types: ['camping'] },
      {
        id: 'campAccess',
        label: 'Camp access and permission',
        kind: 'longtext',
        required: true,
        types: ['camping'],
        hint: 'How you land there, and whether you have checked you may land and camp.',
      },
    ],
  },
];

export function fieldApplies(field: TripField, type: TripType): boolean {
  return !field.types || field.types.includes(type);
}

export function applicableGroups(groups: FieldGroup[], type: TripType): FieldGroup[] {
  return groups
    .map((g) => ({ ...g, fields: g.fields.filter((f) => fieldApplies(f, type)) }))
    .filter((g) => g.fields.length > 0);
}

export const MAX_DAYS = 14;
export const MAX_STOPS = 10;
