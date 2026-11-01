import type { SectionId } from '../clubs/types';

/**
 * How finished a feature is. Shown to the user on every item so that nothing unfinished
 * looks finished.
 *  - ready:   built and usable
 *  - preview: built but its content has not been approved by the club yet
 *  - planned: not built yet; `stage` says when
 *  - blocked: cannot be built until a source document or decision arrives; `blockedBy` says what
 */
export type Status = 'ready' | 'preview' | 'planned' | 'blocked';

/** The last build stage that has been completed. Raise this only when a stage's work is built and tested. */
export const BUILD_STAGE = 3;

export type IconName =
  | 'leadership'
  | 'trip'
  | 'training'
  | 'compass'
  | 'radio'
  | 'book'
  | 'home'
  | 'plans'
  | 'alert'
  | 'info'
  | 'menu'
  | 'close'
  | 'chat'
  | 'external'
  | 'arrow';

export interface SectionItem {
  id: string;
  title: string;
  summary: string;
  status: Status;
  /** Build stage (1 to 6) in which a planned item arrives. */
  stage?: number;
  /** For blocked items: what is missing. */
  blockedBy?: string;
  /** Extra caution or open question shown under the summary. */
  note?: string;
  /** Internal route for items that already exist. */
  href?: string;
}

export interface Section {
  id: SectionId;
  path: string;
  title: string;
  tagline: string;
  icon: IconName;
  /** Build stage in which this section's tools arrive. */
  stage: number;
  intro: string;
  items: SectionItem[];
}

export const sections: Section[] = [
  {
    id: 'leadership',
    path: '/leadership',
    title: 'Leadership',
    tagline: 'Prepare, brief, lead and review a trip.',
    icon: 'leadership',
    stage: 2,
    intro:
      'Everything a trip leader needs before, during and after a trip, built from the leader and rescue-course documents supplied to this project.',
    items: [
      {
        id: 'preparing',
        title: 'Preparing to lead a trip',
        summary:
          'A guided list covering group aims, venue choice, kit, communications, navigation with map, compass and GPS, and escape routes.',
        status: 'preview',
        href: '/leadership/preparing',
        note: 'Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'responsibilities',
        title: 'Leadership responsibilities',
        summary:
          'The leadership areas in the Sea Kayak Leader guidance, plus deployment matters such as first aid, safeguarding and incident reporting.',
        status: 'preview',
        href: '/leadership/responsibilities',
        note:
          'These are British Canoeing documents. A Canoeing Ireland leader equivalent has not been supplied. Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'checklist',
        title: 'Leader preparation checklist',
        summary: 'A tickable checklist drawn from the leader and rescue-course kit lists and the club Basic Safety list.',
        status: 'preview',
        href: '/leadership/checklist',
        note: 'Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'sheets',
        title: 'SHEETS briefing generator',
        summary: 'A form with the six SHEETS headings. It lays out what a leader types in as a printable briefing and lists anything left blank.',
        status: 'preview',
        href: '/leadership/sheets',
        note:
          'The headings come from the public page at saturnbull.co.uk/sheets, paraphrased. Permission to use it, and whether ECSKC uses this version, are not confirmed. The app writes none of the briefing for you.',
      },
      {
        id: 'group',
        title: 'Group management',
        summary:
          'Prompts for communication, line of sight, avoiding hazards and position, with group-size guidance.',
        status: 'preview',
        href: '/leadership/group',
        note: 'Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'risk',
        title: 'Risk assessment and hazard identification',
        summary: 'A form for hazards, who is at risk and the controls, with hazard prompts from the navigation material.',
        status: 'preview',
        href: '/leadership/risk',
        note:
          'A generic layout, not the template ECSKC uses (which has not been supplied). The hazard prompts are from the supplied documents; none of it has been approved by the ECSKC committee.',
      },
      {
        id: 'equipment',
        title: 'Equipment and safety checks',
        summary: 'A pre-launch kit check based on the club Basic Safety list and the leader documents.',
        status: 'preview',
        href: '/leadership/equipment',
        note: 'Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'emergency',
        title: 'Emergency procedures',
        summary: 'A large-type card with the club emergency numbers and the rescue priority rules.',
        status: 'preview',
        href: '/emergency',
        note: 'Draft wording from published sources, not yet approved by the ECSKC committee.',
      },
      {
        id: 'review',
        title: 'Post-trip review',
        summary: 'Strong, Competent or Develop ratings, a reflective-practice box and an incident note.',
        status: 'preview',
        href: '/leadership/review',
        note: 'Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
    ],
  },
  {
    id: 'trip-planning',
    path: '/trip-planning',
    title: 'Trip Planning',
    tagline: 'Plan a day trip or a multi-day expedition.',
    icon: 'trip',
    stage: 3,
    intro: 'Manual trip planning for three kinds of trip, with checklists, print and PDF export.',
    items: [
      {
        id: 'day',
        title: 'Day trip',
        summary: 'Route, participants, tides, weather, kit, safety, communications and transport for a single day.',
        status: 'preview',
        href: '/trip-planning/day',
        note: 'Built to the approved field list; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'multi-day',
        title: 'Multi-day expedition without camping',
        summary: 'Daily stages, accommodation and transport on top of the day-trip fields.',
        status: 'preview',
        href: '/trip-planning/multi-day',
        note: 'Built to the approved field list; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'camping',
        title: 'Multi-day expedition with camping',
        summary: 'Daily stages plus camping gear, food, water and camp access.',
        status: 'preview',
        href: '/trip-planning/camping',
        note: 'ECSKC has not supplied a camping kit list, so camping gear, food and water are free text. Built to the approved field list; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'missing',
        title: 'Missing-information check',
        summary: 'Every plan lists the fields still empty, with a link to each, and the printout marks blanks “Not filled in”.',
        status: 'preview',
        href: '/trip-planning/day',
        note: 'Open any plan to see it. It checks that fields are filled in, not that the plan is sound.',
      },
      {
        id: 'saved',
        title: 'Saved plans',
        summary: 'Create, edit, save, reopen and print a plan, and export it as a PDF, a text file or a trip file.',
        status: 'preview',
        href: '/my-plans',
        note: 'Plans are saved in this browser only, so they do not appear on other devices unless you download the trip file and import it there.',
      },
    ],
  },
  {
    id: 'training',
    path: '/training',
    title: 'Training and Skills',
    tagline: 'Build your skills and track your progress.',
    icon: 'training',
    stage: 4,
    intro: 'A skills library, development plans and checklists, and links to Canoeing Ireland qualifications.',
    items: [
      {
        id: 'library',
        title: 'Skills library',
        summary: 'One page per skill: what it is, how it is performed, common faults and practice.',
        status: 'blocked',
        blockedBy:
          'The sources hold checklists only. Skill descriptions need an approved source, for example the club handling and tide-race articles.',
      },
      {
        id: 'guidance',
        title: 'Training guidance',
        summary: 'How the leader checklist categories and award levels fit together.',
        status: 'planned',
        stage: 4,
      },
      {
        id: 'plan',
        title: 'Skills development plan',
        summary: 'Rate each category Strong, Competent or Develop, pick areas to improve and list actions.',
        status: 'planned',
        stage: 4,
      },
      {
        id: 'checklists',
        title: 'Personal development checklists',
        summary: 'Checklists you tick off and keep on your device.',
        status: 'planned',
        stage: 4,
      },
      {
        id: 'qualifications',
        title: 'Canoeing Ireland qualifications',
        summary: 'The Sea Kayak Skills Award pathway with links to canoe.ie.',
        status: 'planned',
        stage: 4,
      },
    ],
  },
  {
    id: 'navigation',
    path: '/navigation',
    title: 'Navigation and Tides',
    tagline: 'Charts, tides, streams and weather.',
    icon: 'compass',
    stage: 5,
    intro: 'Navigation reference notes, tide and stream tools, Oileáin guidance and weather information.',
    items: [
      {
        id: 'reference',
        title: 'Navigation reference',
        summary: 'Chartwork, tides, weather and pilotage notes, the Beaufort scale and a guide to the sections of Chart 5011.',
        status: 'planned',
        stage: 5,
      },
      {
        id: 'tools',
        title: 'Tide worksheet and calculators',
        summary:
          'Rule of thirds and twelfths, local port times, stream start times, beam-current offset and stream speed. Only rules found in the supplied sources.',
        status: 'planned',
        stage: 5,
      },
      {
        id: 'oileain',
        title: 'Oileáin guidance',
        summary: 'A region index with the standard port used for each coast, and links to the Oileáin sources.',
        status: 'planned',
        stage: 5,
      },
      {
        id: 'allowance',
        title: 'High-water time allowance (Oileáin)',
        summary: 'The extra-time rule around high water that Oileáin describes.',
        status: 'blocked',
        blockedBy:
          'The rule is not recorded in the project notes and the original Oileáin PDF is not in the project. Please point to the pages that state it.',
      },
      {
        id: 'tides',
        title: 'Tidal information',
        summary: 'Predicted high and low water, labelled as predictions, with source, datum and update time.',
        status: 'planned',
        stage: 5,
      },
      {
        id: 'weather',
        title: 'Weather information',
        summary: 'Forecasts and buoy readings where a reliable source exists, and links where it does not.',
        status: 'planned',
        stage: 5,
      },
    ],
  },
  {
    id: 'vhf',
    path: '/vhf',
    title: 'VHF Radio',
    tagline: 'Channels, stations and control areas.',
    icon: 'radio',
    stage: 5,
    intro: 'Marine VHF information for Irish coastal paddling.',
    items: [
      {
        id: 'stations',
        title: 'Station list and channels',
        summary: 'Irish Coast Guard stations with their channels, rebuilt from Marine Notice 61 of 2020 (newer notices still to be checked).',
        status: 'planned',
        stage: 5,
        note: 'The station sheet in the project shows older working channels for 11 of its 16 stations.',
      },
      {
        id: 'areas',
        title: 'Control areas',
        summary: 'Which centre (Dublin MRCC, Malin MRSC or Valentia MRSC) covers which stretch of coast.',
        status: 'planned',
        stage: 5,
        note: 'Two sources disagree on the southern end of the Dublin area; one boundary has to be confirmed with the Coast Guard.',
      },
      {
        id: 'map',
        title: 'Approximate station map',
        summary: 'A schematic map by station name, marked approximate.',
        status: 'planned',
        stage: 5,
        note: 'No verified coordinates have been found, so the map will not claim exact positions.',
      },
      {
        id: 'procedures',
        title: 'Radio procedures and operating guidance',
        summary: 'How to call, make a distress, urgency or safety call, and use DSC.',
        status: 'blocked',
        blockedBy:
          'No document in the project covers radio procedures. Marine Notice 61 of 2020 reportedly includes, as Appendix 2, an Irish Coast Guard guide to sending VHF distress alerts and calls. That could be the source if the club approves it.',
      },
    ],
  },
  {
    id: 'knowledge',
    path: '/knowledge',
    title: 'Knowledge Centre',
    tagline: 'Ask a question and see the sources.',
    icon: 'book',
    stage: 6,
    intro: 'The Kayaking Assistant answers from approved club documents and shows where each answer comes from.',
    items: [
      {
        id: 'assistant',
        title: 'Ask the Kayaking Assistant',
        summary:
          'Ordinary-language questions answered from approved documents, with document and page where available.',
        status: 'planned',
        stage: 6,
        note: 'The button is already in the app, but it is not connected and sends your question nowhere.',
      },
      {
        id: 'documents',
        title: 'Approved documents list',
        summary: 'Which documents the assistant can search, who approved each and when.',
        status: 'planned',
        stage: 6,
      },
      {
        id: 'limits',
        title: 'Sources and limits',
        summary: 'What the app uses, what is live, what is only linked, and what it cannot do.',
        status: 'ready',
        href: '/sources',
      },
    ],
  },
];

export function sectionsForClub(enabled: SectionId[]): Section[] {
  return sections.filter((section) => enabled.includes(section.id));
}

export function findSection(path: string): Section | undefined {
  return sections.find((section) => section.path === path);
}

export function statusLabel(item: Pick<SectionItem, 'status' | 'stage'>): string {
  switch (item.status) {
    case 'ready':
      return 'Available';
    case 'preview':
      return 'Preview';
    case 'planned':
      return item.stage ? `Planned: Stage ${item.stage}` : 'Planned';
    case 'blocked':
      return 'Blocked';
  }
}
