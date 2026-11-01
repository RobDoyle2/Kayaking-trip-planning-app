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
export const BUILD_STAGE = 6;

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
        summary: 'How the leader checklist categories, the safety and rescue course and the Canoeing Ireland award levels fit together.',
        status: 'preview',
        href: '/training/guidance',
        note: 'Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'plan',
        title: 'Skills development plan',
        summary: 'Rate each line of the leader checklist Strong, Competent or Develop, note what to work on and list the actions.',
        status: 'preview',
        href: '/training/plan',
        note: 'Your own self-assessment, kept on this device. Nobody assesses it. Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'checklists',
        title: 'Personal development checklists',
        summary: 'Three checklists you tick off over time and keep on your device: safety and rescue skills, leader rescue skills, and leader paddling and background.',
        status: 'preview',
        href: '/training/checklists',
        note: 'A tick is a private record, not an assessment. Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'qualifications',
        title: 'Canoeing Ireland qualifications',
        summary: 'The Sea Kayak Skills Award levels, with a link to each page on canoe.ie.',
        status: 'preview',
        href: '/training/qualifications',
        note: 'Links and short notes only; award text is not copied. The pages were read on 1 November 2026, so check them.',
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
        summary: 'Chartwork, buoyage, tides and pilotage notes from the supplied navigation course, paraphrased.',
        status: 'preview',
        href: '/navigation/reference',
        note: 'Diagram-only slides and the Chart 5011 key are not included. Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'tools',
        title: 'Tide worksheet and calculators',
        summary:
          'Time from high water, UT to BST, rules of thirds and twelfths, offset angle for a stream, stream speed, atlas rates and cables. Only rules found in the supplied sources.',
        status: 'preview',
        href: '/navigation/tools',
        note: 'Arithmetic on values you type; nothing is fetched or saved. Each rule names its source. Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'oileain',
        title: 'Oileáin guidance',
        summary: 'A region index with the standard port used for each coast, how Oileáin gives times, and links to the Oileáin sources.',
        status: 'preview',
        href: '/navigation/oileain',
        note: 'An index only: the guide’s text and tide tables are not reproduced. Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'allowance',
        title: 'High-water time allowance (Oileáin)',
        summary: 'The extra-time rule around high water that Oileáin describes.',
        status: 'blocked',
        blockedBy:
          'The supplied 332-page PDF contains no such rule and no introduction chapter, so nothing is built for it. Please say where it is printed (perhaps the introduction of the printed edition).',
      },
      {
        id: 'tides',
        title: 'Tidal information',
        summary: 'How to read tide information, and links to prediction sources with their datum and time-zone cautions.',
        status: 'preview',
        href: '/navigation/tides',
        note: 'Not live: this app shows no tide times or heights. The page says why. Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
      },
      {
        id: 'weather',
        title: 'Weather information',
        summary: 'The Beaufort scale, what the course says about wind and weather systems, and links to forecast providers.',
        status: 'preview',
        href: '/navigation/weather',
        note: 'Not live: this app shows no forecast or buoy readings. Built from the supplied documents; the content has not yet been approved by the ECSKC committee.',
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
        status: 'preview',
        href: '/vhf/stations',
        note: 'A December 2020 snapshot read from the afloat.ie copy of the notice. Check the current notice. The project station sheet shows older working channels for 11 of its 16 stations.',
      },
      {
        id: 'areas',
        title: 'Control areas',
        summary: 'Which centre (Dublin MRCC, Malin MRSC or Valentia MRSC) covers which stretch of coast.',
        status: 'blocked',
        blockedBy:
          'The notice’s poster groups stations under the three centres, but its text does not show which station goes where, and two other sources give different southern ends for the Dublin area. One boundary has to be confirmed with the Irish Coast Guard.',
      },
      {
        id: 'map',
        title: 'Approximate station map',
        summary: 'A map of the radio stations.',
        status: 'blocked',
        blockedBy:
          'No verified coordinates were found, and the grouping of stations by control centre is unconfirmed, so any map here would show guessed positions. Marine Notice 61 of 2020 carries the Coast Guard’s own map of the radio sites (its Appendix 1).',
      },
      {
        id: 'procedures',
        title: 'Radio procedures and operating guidance',
        summary: 'How to call, make a distress, urgency or safety call, and use DSC.',
        status: 'blocked',
        blockedBy:
          'No document in the project covers radio procedures. Marine Notice 61 of 2020 includes, as Appendix 2, an Irish Coast Guard guide to sending VHF distress alerts and calls. That could be the source if the club approves it; it has not been used here.',
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
          'Ordinary-language questions answered from the supplied documents, each answer with the passages it rests on, and a search that works without the assistant.',
        status: 'preview',
        href: '/knowledge/search',
        note:
          'The assistant needs a Claude API key set up on the server; until then it says it is not switched on. None of the documents has been approved by the ECSKC committee, and every answer says so.',
      },
      {
        id: 'documents',
        title: 'What the documents cover',
        summary: 'Which sources the assistant can search, how each was read, and what is not covered.',
        status: 'preview',
        href: '/knowledge/documents',
        note: 'No document has been approved by the club yet, so none is marked approved.',
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
