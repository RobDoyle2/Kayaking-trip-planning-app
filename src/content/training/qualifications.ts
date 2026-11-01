/**
 * The Canoeing Ireland Sea Kayak Skills Awards pathway: level names, the page for each on canoe.ie, and one short note.
 * Award text is not copied. The notes are brief paraphrases of what the pages said when read, and each page should be
 * checked, because requirements change.
 */

export interface AwardLevel {
  level: number;
  name: string;
  url: string;
  note: string;
}

export const awardLevels: AwardLevel[] = [
  {
    level: 1,
    name: 'Discovery',
    url: 'https://www.canoe.ie/level-1-sea-kayak-skills/',
    note: 'The first level of the scheme.',
  },
  {
    level: 2,
    name: 'Peer',
    url: 'https://www.canoe.ie/level-2-sea-kayak-skills-award/',
    note: 'ECSKC asks every paddler on its trips to hold at least this level. The Paddler Profile for this level starts from the Level 1 skills standard.',
  },
  {
    level: 3,
    name: 'Explorer',
    url: 'https://www.canoe.ie/level-3-sea-kayak-skills/',
    note: 'The training course asks for the Level 2 certificate or approved prior learning.',
  },
  {
    level: 4,
    name: 'Adventure',
    url: 'https://www.canoe.ie/level-4-sea-kayak-skills/',
    note: 'Attending the assessment asks for Level 3, a Level 4 training course and Canoeing Ireland membership.',
  },
  {
    level: 5,
    name: 'Horizon',
    url: 'https://www.canoe.ie/level-5-sea-kayak-skills/',
    note: 'Has its own page with a training course and further requirements. Read them there.',
  },
];

export const awardLinks = {
  scheme: { label: 'Canoeing Ireland awards and qualifications scheme', url: 'https://www.canoe.ie/paddle-skills-awards/' },
  overview: {
    label: 'Sea Kayak Awards Overview (PDF)',
    url: 'https://www.canoe.ie/wp-content/uploads/2023/03/Sea-Kayak-Awards-Overview-Final-Draft.pdf',
  },
  home: { label: 'Canoeing Ireland', url: 'https://www.canoe.ie/' },
};

/** When these pages were last read. */
export const awardsCheckedOn = '1 November 2026';
