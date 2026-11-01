/**
 * Where Leadership content comes from. Every checklist item, guide section and hazard prompt names one of these.
 * "How read" says honestly whether the original was read directly or only through the project notes.
 */
export interface SourceRef {
  id: string;
  short: string;
  title: string;
  url?: string;
  howRead: string;
}

export const leadershipSources: Record<string, SourceRef> = {
  'ecskc-safety': {
    id: 'ecskc-safety',
    short: 'ECSKC Basic Safety page',
    title: 'East Coast Sea Kayaking Club, Basic Safety for Sea Kayakers (originally published by Canoeing Ireland as Safety on the Water)',
    url: 'https://ecskc.eu/index.php/resources/trip-planning/basic-safety',
    howRead: 'Read in full on 1 November 2026.',
  },
  'ecskc-equipment': {
    id: 'ecskc-equipment',
    short: 'ECSKC Club Equipment page',
    title: 'East Coast Sea Kayaking Club, Club Equipment Loan',
    url: 'https://ecskc.eu/index.php/the-club/club-equipment',
    howRead: 'Seen as a search excerpt only on 1 November 2026. Please check the full page.',
  },
  bcab: {
    id: 'bcab',
    short: 'BCAB Sea Kayak Leader guidance',
    title: 'British Canoeing Awarding Body, Sea Kayak Leader Assessment Guidance (Tidal and Non-Tidal)',
    url: 'https://britishcanoeingawarding.org.uk/download/609/',
    howRead:
      'The October 2021 edition was supplied and read through the project notes. The March 2024 edition (V1-6) was read online and gives the same limits. Page numbers shown are for the March 2024 edition.',
  },
  'bcab-checklist': {
    id: 'bcab-checklist',
    short: 'BCAB Skills Checklist',
    title: 'British Canoeing Awarding Body, Sea Kayak Leader Skills Checklist, October 2021',
    howRead: 'Supplied; read through the project notes, not the original file.',
  },
  fsrt: {
    id: 'fsrt',
    short: 'FSRT course notes',
    title: 'British Canoeing, Foundation Safety and Rescue Training course notes, V2-5, February 2019',
    howRead: 'Supplied; read through the project notes, not the original file.',
  },
  sheets: {
    id: 'sheets',
    short: 'SHEETS (saturnbull)',
    title: 'SHEETS, saturnbull sea kayaking blog (2026 © saturnbull; no author, date or reuse licence stated)',
    url: 'https://saturnbull.co.uk/sheets/',
    howRead: 'Read on 1 November 2026. The prompts are paraphrased. The linked pages on STOP, CLAP and SAFER rescues were not read.',
  },
  clap: {
    id: 'clap',
    short: 'CLAP (Frontier Bushcraft)',
    title: 'Frontier Bushcraft, CLAP: an acronym for outdoor safety',
    url: 'https://frontierbushcraft.com/2013/01/02/clap-outdoor-safety/',
    howRead: 'Seen as a search excerpt on 1 November 2026. Another source expands the A as Awareness rather than Avoidance.',
  },
  hqol: {
    id: 'hqol',
    short: 'High Quality Outdoor Learning',
    title: 'English Outdoor Council, High Quality Outdoor Learning, 2015',
    howRead: 'Supplied; read through the project notes, not the original file.',
  },
  'ci-awards': {
    id: 'ci-awards',
    short: 'Canoeing Ireland award pages',
    title: 'Canoeing Ireland, Sea Kayak Skills Awards (scheme page, level pages and the Sea Kayak Awards Overview)',
    url: 'https://www.canoe.ie/paddle-skills-awards/',
    howRead:
      'The scheme page, the Level 2 and Level 5 pages and the overview PDF were read on 1 November 2026; the Level 1, 3 and 4 pages were seen as search excerpts only. Requirements change, so check each page.',
  },
  oileain: {
    id: 'oileain',
    short: 'Oileáin (supplied PDF)',
    title: 'Oileáin guide to the Irish coast and islands (332-page PDF; edition not stated)',
    howRead: 'Supplied and read directly. Page numbers are PDF pages.',
  },
  shearwater: {
    id: 'shearwater',
    short: 'Shearwater navigation decks',
    title: 'Shearwater Sea Kayaking, Essential Coastal Navigation, Level 4 (Tides and Weather decks)',
    howRead: 'Supplied and read directly.',
  },
};

export function sourceShort(id: string): string {
  return leadershipSources[id]?.short ?? id;
}
